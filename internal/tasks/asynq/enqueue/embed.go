package enqueue

import (
	"context"
	"encoding/json"
	asynqSingleton "gin-notebook/internal/tasks/asynq/singleton"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
)

func EmbedChunk(ctx context.Context, p types.EmbedChunkPayload, opts ...contracts.Option) (string, error) {
	defaults := []contracts.Option{
		contracts.WithQueue(types.QIngest),
		contracts.WithTimeout(300),
		contracts.WithMaxRetry(3),
		// WithUnique(300), // 如果你常需要去重，打开这一行；否则按需在调用处传
	}

	all := append(defaults, opts...)
	b, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	// 无法在请求侧安全计算 content_hash 时，先用 note_id 做 Unique，TTL 短一些
	if ctx == nil {
		ctx = context.Background()
	}

	return asynqSingleton.Dispatcher().Enqueue(ctx, types.EmbedChunkKey, b, all...)
}
