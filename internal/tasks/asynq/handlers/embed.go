package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/thirdparty/aiServer"

	"github.com/hibiken/asynq"
)

func HandleEmbedChunk(ctx context.Context, t *asynq.Task) error {
	var p types.EmbedChunkPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	var chunks []struct {
		ID   int64
		Text string
	}
	if err := database.DB.Table("rag_chunks").
		Select("id, text").
		Where("document_id = ? AND embedding IS NULL", p.DocumentID).
		Find(&chunks).Error; err != nil {
		return err
	}

	ai := aiServer.GetInstance()
	for _, c := range chunks {
		vec, err := ai.Embed(ctx, c.Text)
		if err != nil {
			return fmt.Errorf("embed failed for chunk %d: %w", c.ID, err)
		}
		if err := database.DB.Model(&model.Chunk{}).
			Where("id = ?", c.ID).
			Update("embedding", vec).Error; err != nil {
			return err
		}
	}
	return nil
}
