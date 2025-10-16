package handlers

import (
	"context"
	"encoding/json"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/utils/tools"
	"time"

	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

type SyncDeps struct {
	DB           *gorm.DB
	FeishuClient *feishu.Client
}

func (d *SyncDeps) HandleSyncNote(ctx context.Context, t *asynq.Task) error {
	var p types.SyncNotePayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	// 1️⃣ 构建新索引
	newIdx, err := tools.BuildMdIndex([]byte(p.NewContent))
	if err != nil {
		return err
	}

	// 2️⃣ 获取旧索引（payload 或 DB）
	var oldIdx tools.MDIndex = p.OldIndex

	// 3️⃣ 计算差异
	diff := diffIndexes(oldIdx, newIdx)
	if len(diff.Added) == 0 && len(diff.Deleted) == 0 &&
		len(diff.Updated) == 0 && len(diff.Moved) == 0 {
		return nil
	}

	// 4️⃣ 获取映射信息 & Feishu 文档绑定
	syncRepo := repository.NewSyncRepository(d.DB)
	provider := model.ProviderFeishu
	mappings, err := repository.GetNoteMappingByNoteAndProvider(database.DB, ctx, p.NoteID, provider)
	if err != nil {
		return err
	}
	mapByUID := make(map[string]model.NoteExternalNodeMapping)
	for _, m := range *mappings {
		mapByUID[m.NodeUID] = m
	}

	bindings, _, err := repository.GetNoteSyncList(database.DB, ctx, p.MemberID, &p.NoteID, &provider)
	if err != nil || len(*bindings) == 0 {
		return err
	}
	binding := (*bindings)[0]
	docID := binding.TargetNoteID

	// 5️⃣ 应用差异 → 调飞书 API（仅展示流程）
	// for _, a := range diff.Added {
	// 	_, err := d.FeishuClient.CreateBlock(ctx, docID, mapByUID[a.NodeUID].ExternalBlockID,
	// 		0, mapMdTypeToFsType(a.Type, a.Depth), getTextByHash(a.TextHash))
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	// for _, u := range diff.Updated {
	// 	m := mapByUID[u.NodeUID]
	// 	err := d.FeishuClient.UpdateBlock(ctx, docID, m.ExternalBlockID,
	// 		mapMdTypeToFsType(u.New.Type, u.New.Depth), getTextByHash(u.New.TextHash))
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	// for _, dlt := range diff.Deleted {
	// 	m := mapByUID[dlt.NodeUID]
	// 	_ = d.FeishuClient.DeleteBlock(ctx, docID, m.ExternalBlockID)
	// }

	// for _, mv := range diff.Moved {
	// 	m := mapByUID[mv.NodeUID]
	// 	_ = d.FeishuClient.MoveBlock(ctx, docID, m.ExternalBlockID, "", 0)
	// }

	// 6️⃣ 更新本地索引快照
	// if err := noteRepo.UpdateNoteIndex(ctx, noteID, newIdx); err != nil {
	// 	return err
	// }

	// 7️⃣ 更新映射表（Upsert）
	now := time.Now()
	var updates []model.NoteExternalNodeMapping
	for _, a := range diff.Added {
		updates = append(updates, model.NoteExternalNodeMapping{
			NoteID:          p.NoteID,
			Provider:        model.ProviderFeishu,
			NodeUID:         a.NodeUID,
			LocalNodeType:   a.Type,
			ExternalDocID:   docID,
			ExternalBlockID: "new-block-id",
			SyncStatus:      "synced",
			LastSyncedAt:    now,
		})
	}
	if len(updates) > 0 {
		_ = syncRepo.UpsertNoteExternalNodeMappings(ctx, &updates)
	}

	return nil
}

type diffResult struct {
	Added   []tools.MDItem
	Deleted []tools.MDItem
	Updated []struct {
		NodeUID string
		Old     tools.MDItem
		New     tools.MDItem
	}
	Moved []struct {
		NodeUID string
		OldPath string
		NewPath string
	}
}

func diffIndexes(oldIdx, newIdx tools.MDIndex) diffResult {
	var out diffResult

	for uid, n := range newIdx {
		if o, ok := oldIdx[uid]; !ok {
			out.Added = append(out.Added, n)
		} else {
			contentChanged := o.TextHash != n.TextHash || o.Type != n.Type
			moved := o.Path != n.Path
			if contentChanged {
				out.Updated = append(out.Updated, struct {
					NodeUID string
					Old     tools.MDItem
					New     tools.MDItem
				}{uid, o, n})
			} else if moved {
				out.Moved = append(out.Moved, struct {
					NodeUID string
					OldPath string
					NewPath string
				}{uid, o.Path, n.Path})
			}
		}
	}

	for uid, o := range oldIdx {
		if _, ok := newIdx[uid]; !ok {
			out.Deleted = append(out.Deleted, o)
		}
	}
	return out
}

func mapMdTypeToFsType(t string, depth int) string {
	switch t {
	case "heading":
		if depth == 1 {
			return "heading1"
		}
		if depth == 2 {
			return "heading2"
		}
		return "heading3"
	case "listItem":
		return "ordered_item"
	case "blockquote":
		return "quote"
	default:
		return "paragraph"
	}
}

func getTextByHash(hash string) string {
	// 这里你可以从缓存或本地映射表取原文
	// 暂时直接返回 hash 代表内容
	return hash
}
