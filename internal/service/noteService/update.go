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
			// —— 部分 patch —— //
			// 最小读取：仅取本次操作涉及到的 node_uids 与锚点（afterId/beforeId）
			// 注意：以下调用需要你根据之前我们讨论的方案实现：
			// - blockRepo.GetByUIDsTx
			// - blockRepo.GetLastChildTx
			// - blockRepo.UpsertOneTx / UpdateFieldsTx / SoftDeleteByUIDsTx
			// - service.insertBatchWithAnchors（“分段+拓扑+锚点”一次性分配 LexoRank）
			for _, action := range *params.Actions {
				switch action.Op {
				case "insert":
					if action.Block == nil {
						continue
					}

					if action.AfterID == nil {
						content = append([]dto.NoteBlockDTO{*action.Block}, content...)
					} else if action.BeforeID == nil {
						content = append(content, *action.Block)
					} else {
						index := -1
						for i, block := range content {
							if block.ID == *action.AfterID {
								index = i
								break
							}
						}

						if index != -1 {
							content = append(content[:index+1], append([]dto.NoteBlockDTO{*action.Block}, content[index+1:]...)...)
						} else {
							content = append(content, *action.Block)
						}
					}

				case "update":
					for i, block := range content {
						if block.ID == action.NodeUID {
							if action.Patch.Props != nil {
								content[i].Props.Update(action.Patch.Props)
							}

							if action.Patch.Type != nil {
								content[i].Type = *action.Patch.Type
							}

							if action.Patch.Content != nil {
								content[i].Content = *action.Patch.Content
							}
						}
					}
				case "move":
					// 1. 先找到要移动的节点，并将其从原位置删除
					var movingBlock *dto.NoteBlockDTO
					var movingIndex int
					for i, block := range content {
						if block.ID == action.NodeUID {
							movingBlock = &block
							movingIndex = i
							break
						}
					}

					if movingBlock == nil {
						// 没找到要移动的节点，跳过
						continue
					}

					// 从原位置删除
					content = append(content[:movingIndex], content[movingIndex+1:]...)

					// 2. 根据 afterId 和 beforeId 插入到新位置
					if action.AfterID == nil {
						// 插入到开头
						content = append([]dto.NoteBlockDTO{*movingBlock}, content...)
					} else if action.BeforeID == nil {
						// 插入到结尾
						content = append(content, *movingBlock)
					} else {
						// 插入到中间
						index := -1
						for i, block := range content {
							if block.ID == *action.AfterID {
								index = i
								break
							}
						}

						if index != -1 {
							content = append(content[:index+1], append([]dto.NoteBlockDTO{*movingBlock}, content[index+1:]...)...)
						} else {
							// afterId 没找到，插到末尾
							content = append(content, *movingBlock)
						}
					}
				case "delete":
					for i, block := range content {
						if block.ID == action.NodeUID {
							content = append(content[:i], content[i+1:]...)
							break
						}
					}
				default:
					// return errors.New("unknown action op: " + action.Op)
				}
			}

			updateData["content"] = content
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
				"id":          params.NoteID,
				"is_conflict": true,
				"updated_at":  updateData["updated_at"],
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
