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

func DeleteAIChatPrompt(ctx context.Context, params dto.DeleteAIChatPromptParamsDTO) (responseCode int) {
	// 校验入参：至少要有 ID 或 Intent 其一
	if params.ID == 0 {
		logger.LogWarn("DeleteAIChatPrompt missing identifier (id/intent)")
		responseCode = message.ERROR_INVALID_PARAMS
		return
	}

	var (
		prompt model.AiPrompt
	)

	// 事务删除（先查再删，便于拿到 intent 用于缓存失效）
	err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		prompt, err = repository.GetAiPromptByID(tx, ctx, params.ID)

		// 先查
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorsx.ErrAIPromptNotFound // 你项目里若没有这个错误，替换为自定义 not found
			}
			return err
		}

		// 删除（软删或硬删，取决于你的模型；这里用 GORM 默认 Delete）
		if err := repository.DeleteAiPromptByID(tx, ctx, params.ID); err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		if errors.Is(err, errorsx.ErrAIPromptNotFound) || errors.Is(err, gorm.ErrRecordNotFound) {
			responseCode = message.ERROR_AI_PROMPT_NOT_FOUND // 按你的枚举替换
		} else {
			logger.LogError(err, "删除 AI Prompt 失败")
			responseCode = database.IsError(err)
		}
		return
	}

	// ===== 缓存失效 =====
	// 使用单飞锁避免并发读在回源期间读到不一致
	key := cache.PromptPrefix + prompt.Intent
	lockKey := key + ":lock"

	unlock, lerr := cache.RedisInstance.Lock(ctx, lockKey, 20*time.Second)
	if lerr == nil && unlock != nil {
		defer unlock()
	}

	// 1) 删除 prompt 的 hash
	if derr := cache.RedisInstance.Client.Del(ctx, key).Err(); derr != nil {
		logger.LogWarn(derr, "删除 prompt 缓存失败", "intent", prompt.Intent)
	}

	// 2) 从 intents 集合移除该 intent（保持列表一致）
	if sErr := cache.RedisInstance.Client.SRem(ctx, cache.IntentListKey, prompt.Intent).Err(); sErr != nil {
		logger.LogWarn(sErr, "SREM intent 失败", "intent", prompt.Intent)
	}

	// （可选）如果你采用逻辑过期，也可以用回拨过期时间代替 Del：
	// _ = cache.RedisInstance.Client.HSet(ctx, key, "expired_at", time.Now().Add(-time.Minute).Format(time.RFC3339)).Err()

	responseCode = message.SUCCESS
	return
}
