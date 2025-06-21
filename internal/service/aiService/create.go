package aiService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"

	"gorm.io/gorm"
)

func AIMessage(ctx context.Context, params *dto.AIMessageParamsDTO) (responseCode int, data *dto.AIMessageResponseDTO) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if params.Action == "init" {
			session := model.AISession{
				UserID: params.UserID,
			}

			if params.Title != nil {
				session.Title = *params.Title
			}
			if err := repository.CreateAISeesion(tx, &session); err != nil {
				responseCode = message.ERROR_AI_SESSION_CREATE
				return err
			}
			params.SessionID = &session.ID
		}
		index, err := repository.GetNextIndex(tx, ctx, *params.SessionID)
		if err != nil {
			responseCode = message.ERROR_AI_MESSAGE_INDEX
			return err
		}

		messageModel := model.AIMessage{
			SessionID: *params.SessionID,
			Content:   params.Content,
			Role:      params.Role,
			Status:    params.Status,
			UserID:    params.UserID,
			Index:     index,
			ParentID:  params.ParentID,
		}
		err = repository.CreateAIMessage(tx, &messageModel)
		if err != nil {
			responseCode = message.ERROR_AI_MESSAGE_CREATE
			return err
		}

		data = &dto.AIMessageResponseDTO{
			SessionID: messageModel.SessionID,
			MessageID: messageModel.ID,
		}
		return nil
	})

	if err != nil {
		return
	}
	responseCode = message.SUCCESS
	return
}
