package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	auditContext "gin-notebook/internal/context"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"reflect"

	"github.com/hibiken/asynq"
)

func safeEqual(a, b any) bool { return reflect.DeepEqual(a, b) }

type LookupConfig struct {
	Model any    // 零值指针：&model.ToDoColumn{} / &model.ToDoTask{} ...
	Field string // 要取的列名：name / title / content ...
	Alias string // 可选的列别名，默认用 Field
}

var (
	ignored_fields = []string{"updated_at", "created_at", "deleted_at"}
	lookup_fields  = map[string]LookupConfig{
		"column_id":  {Model: &model.ToDoColumn{}, Field: "name", Alias: "column name"},
		"task_id":    {Model: &model.ToDoTask{}, Field: "title", Alias: "task title"},
		"project_id": {Model: &model.Project{}, Field: "name", Alias: "project name"},
		"comment_id": {Model: &model.ToDoTaskComment{}, Field: "content", Alias: "comment content"},
	}
)

func GetFieldValues(cfg LookupConfig, ids []int64) (map[int64]string, error) {
	if len(ids) == 0 {
		return map[int64]string{}, nil
	}

	type row struct {
		ID int64          `gorm:"column:id"`
		V  sql.NullString `gorm:"column:v"`
	}
	var rows []row

	// 安全做法：列名来自白名单 cfg.Field。
	// 下面用 clause.Expr 把列名安全地作为标识符注入，并起别名 v。
	err := database.DB.Model(cfg.Model).
		Select("id, "+cfg.Field+" AS v").
		Where("id IN ?", ids).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	out := make(map[int64]string, len(rows))
	for _, r := range rows {
		if r.V.Valid {
			out[r.ID] = r.V.String
		} else {
			out[r.ID] = "" // 也可返回占位或不写入
		}
	}
	return out, nil
}

func KanbanActivity(ctx context.Context, t *asynq.Task) error {
	logger.LogInfo("KanbanActivity task started")
	var p types.KanbanActivityPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	meta := auditContext.FromContext(ctx)

	logModels := []model.KanbanActivity{}

	SummaryKey := string(p.TargetType) + "." + string(p.Action)

	if p.Action == model.UpdateAction && p.OriginData != nil {
		// 记录变更前后的对比
		for k, v := range p.Patch {
			// 判断是否在忽略字段内
			if tools.Contains(ignored_fields, k) {
				logger.LogInfo("Audit log ignore field:", k)
				continue
			}

			originValue, err := tools.GetField(p.OriginData, k)
			if err != nil {
				fmt.Println("[Warning] audit log get origin field '", k, "' error:", err)
				continue
			}

			if originValue == v {
				logger.LogInfo("Ignore same value of field:", k)
				continue
			}

			PatchData := map[string]types.FieldChange{
				k: {
					From: originValue,
					To:   v,
				},
			}

			parsedData, err := json.Marshal(PatchData)
			if err != nil {
				fmt.Println("[Warning] audit log marshal patch data error:", err)
				continue
			}

			var summaryParams = map[string]interface{}{
				"field": k,
				"from":  originValue,
				"to":    v,
			}

			if cfg, ok := lookup_fields[k]; ok {

				fromValue, ok := tools.ToInt64(originValue)
				if !ok {
					return fmt.Errorf("invalid origin value type for field %s: %T", k, originValue)
				}

				toValue, ok := tools.ToInt64(v)
				if !ok {
					return fmt.Errorf("invalid new value type for field %s: %T", k, v)
				}

				ids := []int64{fromValue, toValue}
				vals, err := GetFieldValues(cfg, ids)

				if err == nil {
					fieldName := cfg.Field

					if cfg.Alias != "" {
						fieldName = cfg.Alias
					}
					summaryParams = map[string]interface{}{
						"field": fieldName,
						"from":  vals[fromValue],
						"to":    vals[toValue],
					}
				}
			}

			kanbanLog := model.KanbanActivity{
				ActorID:  p.ActorID,
				MemberID: p.MemberID,

				RequestID: meta.RequestID,
				IP:        meta.IP,
				UA:        meta.UA,

				ColumnID:    p.ColumnID,
				TaskID:      p.TaskID,
				ProjectID:   p.ProjectID,
				WorkspaceID: p.WorkspaceID,
				CommentID:   p.CommentID,
				Attachment:  p.AttacchmentID,

				Action:     p.Action,
				TargetType: p.TargetType,
				TargetID:   p.TargetID,

				SummaryKey:      SummaryKey,
				SummaryParams:   summaryParams,
				SummaryFallback: fmt.Sprintf("更新了 %s 的 %s 字段", p.TargetType, k),

				Field:      k,
				Patch:      parsedData,
				Success:    p.Success,
				StatusCode: p.SuccessCode,
			}

			logModels = append(logModels, kanbanLog)
		}
	} else {
		kanbanLog := model.KanbanActivity{
			ActorID:  p.ActorID,
			MemberID: p.MemberID,

			RequestID: meta.RequestID,
			IP:        meta.IP,
			UA:        meta.UA,

			ColumnID:    p.ColumnID,
			TaskID:      p.TaskID,
			ProjectID:   p.ProjectID,
			WorkspaceID: p.WorkspaceID,
			CommentID:   p.CommentID,
			Attachment:  p.AttacchmentID,

			Action:     p.Action,
			TargetType: p.TargetType,
			TargetID:   p.TargetID,

			SummaryKey:      SummaryKey,
			SummaryFallback: fmt.Sprintf("%s 了 %s", p.Action, p.TargetType),

			Success:    p.Success,
			StatusCode: p.SuccessCode,
		}
		logModels = append(logModels, kanbanLog)
	}

	err := repository.CreateModel(database.DB, &logModels)
	if err != nil {
		fmt.Println("[Error] audit log create error:", err)
		return err
	}

	return nil
}
