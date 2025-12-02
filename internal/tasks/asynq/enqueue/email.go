package enqueue

import (
	"context"
	"encoding/json"
	asynqSingleton "gin-notebook/internal/tasks/asynq/singleton"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
)

// SendEmail 一行入队邮件任务：带默认队列/超时/重试；调用方可用 opts 覆盖默认
func SendEmail(ctx context.Context,
	to, subject, template string,
	data map[string]any,
	meta types.Meta,
	opts ...contracts.Option,
) (string, error) {
	p := types.EmailPayload{
		To:       to,
		Subject:  subject,
		Template: template,
		Data:     data,
		Meta:     meta,
	}
	return EnqueueEmail(ctx, p, opts...)
}

// EnqueueEmail 用已构造的 payload 入队（同样带默认策略，支持覆盖）
func EnqueueEmail(ctx context.Context, p types.EmailPayload, opts ...contracts.Option) (string, error) {
	// 默认策略放在前面；调用方传入的 opts 追加在后面，"后者覆盖前者"
	defaults := []contracts.Option{
		contracts.WithQueue("default"),
		contracts.WithTimeout(30),
		contracts.WithMaxRetry(3),
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
	return asynqSingleton.Dispatcher().Enqueue(ctx, types.TypeEmailSend, b, all...)
}
