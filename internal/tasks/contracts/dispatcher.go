package contracts

import "context"

// JobKey 是任务类型键，如 "email:send"
type JobKey string

// Dispatcher 供业务层调用，屏蔽底层 asynq / 其他实现
type Dispatcher interface {
	// Enqueue 原子入队，opts 控制队列、延时、重试等
	Enqueue(ctx context.Context, key JobKey, payload []byte, opts ...Option) (TaskID string, err error)
}

// Option 是通用可选项（定义在同包或公共包均可）
type Option interface {
	Apply(*EnqueueOptions)
}

// EnqueueOptions 由 Option 们聚合而成
type EnqueueOptions struct {
	Queue      string
	TimeoutSec int
	MaxRetry   int
	DelaySec   int
	UniqueTTL  int // 秒，窗口内去重
}
