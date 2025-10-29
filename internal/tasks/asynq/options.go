package asynqimpl

import (
	"gin-notebook/internal/tasks/contracts"
	"time"

	"github.com/hibiken/asynq"
)

func toAsynqOpts(in *contracts.EnqueueOptions) []asynq.Option {
	var out []asynq.Option
	if in.Queue != "" {
		out = append(out, asynq.Queue(in.Queue))
	}
	if in.TimeoutSec > 0 {
		out = append(out, asynq.Timeout(time.Duration(in.TimeoutSec)*time.Second))
	}
	if in.MaxRetry >= 0 {
		out = append(out, asynq.MaxRetry(in.MaxRetry))
	}
	if in.DelaySec > 0 {
		out = append(out, asynq.ProcessIn(time.Duration(in.DelaySec)*time.Second))
	}
	if in.UniqueTTL > 0 {
		out = append(out, asynq.Unique(time.Duration(in.UniqueTTL)*time.Second))
	}
	return out
}

// 一些便捷 Option
type optFn func(*contracts.EnqueueOptions)

func (f optFn) Apply(o *contracts.EnqueueOptions) { f(o) }

func WithQueue(q string) contracts.Option {
	return optFn(func(o *contracts.EnqueueOptions) { o.Queue = q })
}
func WithTimeout(sec int) contracts.Option {
	return optFn(func(o *contracts.EnqueueOptions) { o.TimeoutSec = sec })
}
func WithMaxRetry(n int) contracts.Option {
	return optFn(func(o *contracts.EnqueueOptions) { o.MaxRetry = n })
}
func WithDelay(sec int) contracts.Option {
	return optFn(func(o *contracts.EnqueueOptions) { o.DelaySec = sec })
}
func WithUnique(ttlSec time.Duration) contracts.Option {
	return optFn(func(o *contracts.EnqueueOptions) { o.UniqueTTL = ttlSec })
}

func DefaultOptions() []asynq.Option {
	return []asynq.Option{
		asynq.Queue("default"),
		asynq.Timeout(30 * time.Second),
		asynq.MaxRetry(3),
	}
}
