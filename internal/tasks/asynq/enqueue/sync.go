package enqueue

import (
	"context"
	"encoding/json"
	asynqimpl "gin-notebook/internal/tasks/asynq"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
)

func SyncNote(ctx context.Context, p types.SyncNotePayload, opts ...contracts.Option) (string, error) {
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

	return asynqimpl.Dispatcher().Enqueue(ctx, types.SyncNoteKey, b, all...)

}
