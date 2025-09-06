package enqueue

import (
	"context"
	"encoding/json"
	"fmt"
	auditContext "gin-notebook/internal/context"
	asynqimpl "gin-notebook/internal/tasks/asynq"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
	"gin-notebook/pkg/logger"
)

func KanbanActivityJob(ctx context.Context, p types.KanbanActivityPayload, opt ...contracts.Option) (string, error) {
	// 默认策略放在前面；调用方传入的 opts 追加在后面，"后者覆盖前者"
	defaults := []contracts.Option{
		asynqimpl.WithQueue("low"), // 审计日志不急
		asynqimpl.WithTimeout(10),
		asynqimpl.WithMaxRetry(2), // 不用重试，失败就算了
	}
	all := append(defaults, opt...)

	b, err := json.Marshal(p)
	if err != nil {
		logger.LogError(err, "KanbanActivity json marshal error")
		return "", err
	}
	// 防御空 ctx
	if ctx == nil {
		ctx = context.Background()
	}

	auditMeta := auditContext.FromContext(ctx)

	fmt.Println("auditMeta:", auditMeta)

	return asynqimpl.Dispatcher().Enqueue(ctx, types.KanbanActivityKey, b, all...)
}
