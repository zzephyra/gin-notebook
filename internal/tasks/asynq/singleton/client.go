package asynqSingleton

import (
	"context"
	"crypto/sha256"
	"gin-notebook/internal/tasks/contracts"

	"github.com/hibiken/asynq"
)

type Client struct {
	cli *asynq.Client
}

func NewClient(redisAddr, password string, db int) *Client {
	return &Client{
		cli: asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr, Password: password, DB: db}),
	}
}

func (c *Client) Close() error { return c.cli.Close() }

func (c *Client) Enqueue(ctx context.Context, key contracts.JobKey, payload []byte, opts ...contracts.Option) (string, error) {
	opt := &contracts.EnqueueOptions{Queue: "default", TimeoutSec: 60, MaxRetry: 8}
	for _, o := range opts {
		o.Apply(opt)
	}

	task := asynq.NewTask(string(key), payload)

	// 如果配置了 Unique，但你还想更强的幂等，可把哈希加入任务名或 payload
	_ = sha256.Sum256(payload) // 可按需使用

	info, err := c.cli.EnqueueContext(ctx, task, contracts.ToAsynqOpts(opt)...)
	if err != nil {
		return "", err
	}
	return info.ID, nil
}
