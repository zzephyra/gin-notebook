package aiService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"

	"gorm.io/gorm"
)

func UpdateAIMessage(ctx context.Context, params *dto.AIMessageUpdateParamsDTO) (responseCode int) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := repository.UpdateAIMessage(tx, params.MessageID, params.UserID, map[string]interface{}{
			"content": params.Content,
			"status":  params.Status,
		}); err != nil {
			responseCode = message.ERROR_AI_MESSAGE_UPDATE
			return err
		}
		return nil
	})

	if err != nil {
		return
	}
	return message.SUCCESS
}
