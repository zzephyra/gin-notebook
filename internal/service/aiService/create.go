package aiService

import (
	"context"
	"errors"
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/errorsx"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/thirdparty/aiServer"
	"gin-notebook/pkg/logger"
	"time"

	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

func AIMessage(ctx context.Context, params *dto.AIMessageParamsDTO) (responseCode int, data *dto.AIMessageResponseDTO) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if params.Action == "init" {
			session := model.AISession{
				MemberID: params.MemberID,
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

		instance := aiServer.GetInstance()
		embeddings, err := instance.Embed(ctx, params.Content)
		if err != nil {
			responseCode = message.ERROR_AI_EMBEDDING
			logger.LogError(err)
			return err
		}

		messageModel := model.AIMessage{
			SessionID: *params.SessionID,
			Content:   params.Content,
			Role:      params.Role,
			Status:    params.Status,
			MemberID:  params.MemberID,
			Index:     index,
			ParentID:  params.ParentID,
			Embedding: pgvector.NewVector(embeddings),
		}
		err = repository.CreateAIMessage(tx, &messageModel)
		if err != nil {
			logger.LogError(err, "创建 AI Message 失败")
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

func CreateAIChatPrompt(ctx context.Context, params dto.AIChatPromptCreateParamsDTO) (responseCode int, data *dto.AIChatPromptDTO) {
	prompt := model.AiPrompt{
		Intent:      params.Intent,
		Description: params.Description,
		Template:    params.Template,
		IsActive:    true, // 默认激活
	}

	err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		err := repository.InsertAiPrompt(tx, &prompt)
		return err
	})

	if err != nil {
		if errors.Is(err, errorsx.ErrAIPromptExists) {
			responseCode = message.ERROR_AI_PROMPT_EXIST
		} else {
			logger.LogError(err, "创建 AI Prompt 失败")
			responseCode = database.IsError(err)
		}
		return
	}

	// var ttl = time.Duration(rand.Int64N(int64(24*time.Hour))) + 24*time.Hour
	var ttl = time.Duration(0) // 永不过期 暂定
	cacheErr := cache.RedisInstance.MarshalAndSet(ctx, "ai:prompt:"+prompt.Intent, prompt, ttl)
	if cacheErr != nil {
		logger.LogWarn(cacheErr, fmt.Sprintf("缓存新建prompt失败: %s", prompt.Template))
	}

	data = &dto.AIChatPromptDTO{
		ID:          prompt.ID,
		Intent:      prompt.Intent,
		Description: prompt.Description,
		Template:    prompt.Template,
		IsActive:    prompt.IsActive,
		UpdatedAt:   prompt.BaseModel.UpdatedAt,
		PromptType:  prompt.PromptType,
		Version:     prompt.Version,
	}

	responseCode = message.SUCCESS
	return
}
