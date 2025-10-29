package enqueue

import (
	"context"
	"encoding/json"
	asynqimpl "gin-notebook/internal/tasks/asynq"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
	"gin-notebook/pkg/logger"
)

func SyncInitNote(ctx context.Context, p types.SyncNotePayload, opts ...contracts.Option) (string, error) {
	defaults := []contracts.Option{
		asynqimpl.WithQueue("default"),
		asynqimpl.WithTimeout(30),
		asynqimpl.WithMaxRetry(3),
		// WithUnique(300), // 如果你常需要去重，打开这一行；否则按需在调用处传
	}
	all := append(defaults, opts...)

	b, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	// 防御空 ctx
	if ctx == nil {
		ctx = context.Background()
	}

	return asynqimpl.Dispatcher().Enqueue(ctx, types.InitSyncNoteKey, b, all...)

}

func SyncDelta(ctx context.Context, p types.SyncDeltaPayload, opts ...contracts.Option) (string, error) {
	logger.LogInfo("123")
	defaults := []contracts.Option{
		asynqimpl.WithQueue("default"),
		asynqimpl.WithTimeout(300),
		asynqimpl.WithMaxRetry(3),
	}
	all := append(defaults, opts...)

	b, err := json.Marshal(p)
	if err != nil {
		logger.LogError(err, "Failed to marshal SyncDeltaPayload", map[string]interface{}{
			"payload": p,
		})
		return "", err
	}
	if ctx == nil {
		ctx = context.Background()
	}

	return asynqimpl.Dispatcher().Enqueue(ctx, types.SyncDeltaKey, b, all...)

}
