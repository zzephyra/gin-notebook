package noteService

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"reflect"
	"time"

	"gorm.io/gorm"
)

func applyPropsPatch(dst *dto.BlockPropsDTO, patch *dto.BlockPropsDTO) {
	if patch == nil || dst == nil {
		return
	}
	dv := reflect.ValueOf(dst).Elem()
	pv := reflect.ValueOf(patch).Elem()

	for i := 0; i < dv.NumField(); i++ {
		pf := pv.Field(i)
		df := dv.Field(i)

		// 仅当 patch 对应字段非 nil 时才更新
		if pf.Kind() == reflect.Ptr && !pf.IsNil() {
			df.Set(pf)
		}
	}
}

// internal/service/noteService/update.go 或你现有位置
func UpdateNote(ctx context.Context, params *dto.UpdateWorkspaceNoteValidator) (responseCode int, data any) {
	db := database.DB

	// 基础校验：不允许同时走两条内容通道，避免冲突
	if params.Actions != nil && params.Content != nil {
		responseCode = message.ERROR
		// responseCode = message.ERROR_INVALID_PARAM // 自行定义：不能同时传 actions 与 content
		return
	}

	// —— 事务 —— //
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		note, err := repository.GetNoteByID(db, ctx, params.WorkspaceID, params.NoteID)

		updateData := params.ToUpdate()
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		if note == nil {
			responseCode = message.ERROR_NOTE_NOT_FOUND
			return fmt.Errorf("note not found")
		}

		var content dto.Blocks
		if err := json.Unmarshal(note.Content, &content); err != nil {
			responseCode = message.ERROR
			return err
		}
		switch {
		case params.Actions != nil:
			updateData["content"] = dto.UpdateBlock(content, *params.Actions)
		default:
			// 只改元数据，什么也不做
		}

		if database.IsPostgres() {
			updateData["updated_at"] = time.Now().UTC().Truncate(time.Microsecond)
		} else {
			updateData["updated_at"] = time.Now().UTC().Truncate(time.Millisecond)
		}

		isConflict, err := repository.UpdateNote(tx, params.NoteID, params.UpdatedAt, updateData)
		if isConflict {
			data = map[string]interface{}{
				"note": map[string]interface{}{
					"id":          params.NoteID,
					"is_conflict": true,
					"updated_at":  note.UpdatedAt,
				},
			}
			responseCode = message.ERROR_NOTE_UPDATE_CONFLICT
			return fmt.Errorf("update conflict")
		}
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		data = map[string]interface{}{
			"note": updateData,
		}
		return nil
	})

	if responseCode != 0 {
		return
	}

	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	return
}

func UpdateNoteCategory(params *dto.UpdateNoteCategoryDTO) (responseCode int, data any) {
	err := repository.UpdateNoteCategory(params.ID, params.ToMap())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	return
}
