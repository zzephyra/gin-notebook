package aiService

import (
	"context"
	"errors"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/errorsx"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"time"

	"gorm.io/gorm"
)

func UpdateAIMessage(ctx context.Context, params *dto.AIMessageUpdateParamsDTO) (responseCode int) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := repository.UpdateAIMessage(tx, params.MessageID, params.MemberID, map[string]interface{}{
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

func UpdateAIPrompt(ctx context.Context, params *dto.UpdateAIChatPromptParamsDTO) (responseCode int) {
	var (
		pm  model.AiPrompt
		err error
	)

	// 2) 事务更新（只更新传入字段）
	err = database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 2.1 先查，便于拿到 intent 做缓存键
		if err := tx.First(&pm, params.ID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorsx.ErrAIPromptNotFound
			}
			return err
		}

		// 2.2 组装更新字段
		update := map[string]any{}
		if params.Template != nil {
			update["template"] = *params.Template
		}
		if params.Description != nil {
			update["description"] = *params.Description
		}
		if params.IsActive != nil {
			update["is_active"] = *params.IsActive
		}
		if len(update) == 0 {
			return nil // 实际无可更新，视为成功
		}

		// 2.3 执行更新
		if err := tx.Model(&model.AiPrompt{}).Where("id = ?", params.ID).Updates(update).Error; err != nil {
			return err
		}

		// 2.4 取回最新值
		if err := tx.First(&pm, params.ID).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		switch {
		case errors.Is(err, errorsx.ErrAIPromptNotFound), errors.Is(err, gorm.ErrRecordNotFound):
			responseCode = message.ERROR_AI_PROMPT_NOT_FOUND
		default:
			logger.LogError(err, "更新 AI Prompt 失败")
			responseCode = database.IsError(err)
		}
		return
	}

	// 3) 缓存刷新（单飞锁 + HSET 指定字段）
	key := cache.PromptPrefix + pm.Intent
	lockKey := key + ":lock"
	unlock, lerr := cache.RedisInstance.Lock(ctx, lockKey, 20*time.Second)
	if lerr == nil && unlock != nil {
		defer unlock()
	}

	// 3.1 只写必要字段，避免复杂类型序列化问题
	now := time.Now()
	ttl := 10 * time.Minute
	cacheMap := map[string]any{
		"id":         pm.ID, // HSET 支持数字，读取时你是 string，可在读侧转
		"intent":     pm.Intent,
		"template":   pm.Template,
		"is_active":  pm.IsActive,
		"updated_at": pm.UpdatedAt.Format(time.RFC3339),
		"expired_at": now.Add(ttl).Format(time.RFC3339),
	}
	if pm.Description != nil {
		cacheMap["description"] = *pm.Description
	} else {
		// 若 DB 置空描述，确保缓存也移除该字段（可选）
		// go-redis 没有原子“删除某个 field 再 HSET”的混合写；这里单独删一下
		_ = cache.RedisInstance.Client.HDel(ctx, key, "description").Err()
	}

	if err := cache.RedisInstance.Client.HSet(ctx, key, cacheMap).Err(); err != nil {
		// 缓存失败不影响主流程；打警告
		logger.LogWarn(err, "HSET prompt cache failed", "intent", pm.Intent)
	}

	responseCode = message.SUCCESS
	return
}
