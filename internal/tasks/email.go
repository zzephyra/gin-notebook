package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/pkg/email"

	"github.com/hibiken/asynq"
)

var (
	TypeEmailDelivery = "email:deliver"
)

type EmailPayload struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func SendEmailTask(ctx context.Context, t *asynq.Task) error {
	var p EmailPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}
	// 这里可以调用发送邮件的函数
	if err := email.SendEmail(p.To, p.Subject, p.Body); err != nil {
		return fmt.Errorf("failed to send email: %v", err)
	}
	return nil
}
