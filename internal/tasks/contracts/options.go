package contracts

import (
	"time"

	"github.com/hibiken/asynq"
)

func ToAsynqOpts(in *EnqueueOptions) []asynq.Option {
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
type optFn func(*EnqueueOptions)

func (f optFn) Apply(o *EnqueueOptions) { f(o) }

func WithQueue(q string) Option {
	return optFn(func(o *EnqueueOptions) { o.Queue = q })
}
func WithTimeout(sec int) Option {
	return optFn(func(o *EnqueueOptions) { o.TimeoutSec = sec })
}
func WithMaxRetry(n int) Option {
	return optFn(func(o *EnqueueOptions) { o.MaxRetry = n })
}
func WithDelay(sec int) Option {
	return optFn(func(o *EnqueueOptions) { o.DelaySec = sec })
}
func WithUnique(ttlSec time.Duration) Option {
	return optFn(func(o *EnqueueOptions) { o.UniqueTTL = ttlSec })
}

func DefaultOptions() []asynq.Option {
	return []asynq.Option{
		asynq.Queue("default"),
		asynq.Timeout(30 * time.Second),
		asynq.MaxRetry(3),
	}
}
