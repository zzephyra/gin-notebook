package handlers

import (
	"context"
	"encoding/json"
	"gin-notebook/internal/tasks/asynq/types"
	"log"

	"github.com/hibiken/asynq"
)

func HandleEmailSend(ctx context.Context, t *asynq.Task) error {
	var p types.EmailPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	// 幂等：用业务键去重（比如写一条发送记录有唯一索引 (to,subject,template,hash(data))）
	// if alreadySent(p) { return nil }

	// TODO: 调用你现有的发信逻辑
	log.Printf("[email] send to=%s subject=%s actor=%s", p.To, p.Subject, p.Meta.ActorID)

	// 返回 error 让 asynq 重试；返回 nil 视为成功
	return nil
}
