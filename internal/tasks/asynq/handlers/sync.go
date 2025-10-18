package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"time"

	larkdocx "github.com/larksuite/oapi-sdk-go/v3/service/docx/v1"

	"github.com/hibiken/asynq"

	"gorm.io/gorm"
)

type SyncDeps struct {
	DB           *gorm.DB
	FeishuClient *feishu.Client
}

func HandleSyncNote(ctx context.Context, t *asynq.Task) error {
	var p types.SyncNotePayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	integrationRepo := repository.NewIntegrationRepository(database.DB)
	account, err := integrationRepo.GetIntegrationAccountByUser(ctx, tools.Ptr(model.ProviderFeishu), &p.UserID)
	if err != nil {
		return err
	}

	unlock, err := cache.RedisInstance.Lock(ctx, fmt.Sprintf("sync:feishu:%d", p.NoteID), 5*time.Minute)
	if err != nil {
		return err
	}
	defer unlock()

	client := feishu.GetClient()

	if client == nil {
		return fmt.Errorf("Feishu integration not configured")
	}

	note, err := repository.GetNoteByID(database.DB, ctx, p.WorkspaceID, p.NoteID)

	if err != nil {
		logger.LogError(err, "Failed to get local note")
		return err
	}

	var blocks dto.Blocks
	if err := json.Unmarshal(note.Content, &blocks); err != nil {
		logger.LogError(err, "Unmarshal local note content error")
		return err
	}

	remoteBlocks, err := client.GetNoteAllBlocks(ctx, account.AccessTokenEnc, p.TargetNoteID, nil)

	if err != nil {
		logger.LogError(err, "Failed to get note blocks from Feishu", map[string]interface{}{
			"note_id":        p.NoteID,
			"target_note_id": p.TargetNoteID,
		})
		return err
	}

	var feishuPageUID string
	for _, block := range remoteBlocks.Items {
		if *block.BlockType == 1 {
			feishuPageUID = *block.BlockId
			break
		}
	}
	feishuBlocks := feishu.ParseBlockToLark(blocks)

	chunks := tools.Chunk(feishuBlocks, 20)

	children := []*larkdocx.Block{}
	for _, chunk := range chunks {
		data, err := client.CreateBlocks(ctx, account.AccessTokenEnc, feishuPageUID, feishuPageUID, chunk, 0)

		if err != nil {
			logger.LogError(err, "Failed to create blocks to Feishu", map[string]interface{}{
				"note_id":        p.NoteID,
				"target_note_id": p.TargetNoteID,
			})
			return err
		}
		children = append(children, data.Children...)
	}

	if err != nil {
		logger.LogError(err, "Failed to create blocks to Feishu", map[string]interface{}{
			"note_id":        p.NoteID,
			"target_note_id": p.TargetNoteID,
		})
		return err
	}

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		syncRepo := repository.NewSyncRepository(tx)

		var timestamp = time.Now().UTC()
		var NodeMappings = []model.NoteExternalNodeMapping{}

		for idx, child := range children {
			node := model.NoteExternalNodeMapping{
				NoteID:           p.NoteID,
				Provider:         model.ProviderFeishu,
				NodeUID:          blocks[idx].ID,
				ExternalDocID:    p.TargetNoteID,
				ExternalBlockID:  *child.BlockId,
				ExternalParentID: *child.ParentId,
				SyncStatus:       model.SyncSuccess,
				LastSyncedAt:     timestamp,
			}

			NodeMappings = append(NodeMappings, node)
		}

		if err := syncRepo.UpsertNoteExternalNodeMappings(ctx, &NodeMappings); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		logger.LogError(err, "创建映射失败")
		return err
	}

	remoteBlocksAfter, err := client.GetNoteAllBlocks(ctx, account.AccessTokenEnc, p.TargetNoteID, nil)

	var noChange = false

	if prefixEquals(remoteBlocksAfter.Items, remoteBlocks.Items) {
		noChange = true
	}

	if len(remoteBlocks.Items) > 1 && noChange {
		err = client.DeleteBlocks(ctx, p.TargetNoteID, account.AccessTokenEnc, feishuPageUID, 0, len(remoteBlocks.Items)-1)
		if err != nil {
			logger.LogError(err, "Failed to delete old blocks from Feishu", map[string]interface{}{
				"note_id":        p.NoteID,
				"target_note_id": p.TargetNoteID,
			})
			return err
		}
	}

	return nil
}

func prefixEquals(full, prefix []*larkdocx.Block) bool {
	if len(full) < len(prefix) {
		return false
	}
	for i := range prefix {
		if full[i].BlockId != prefix[i].BlockId {
			return false
		}
	}
	return true
}
