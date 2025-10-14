package types

import "github.com/hibiken/asynq"

const (
	TypeFeishuRefreshAllUserTokens = "feishu:refresh_all_user_tokens"
)

// 可以无 payload；如需按租户/批次，可加字段
func NewFeishuRefreshAllUserTokensTask() *asynq.Task {
	return asynq.NewTask(TypeFeishuRefreshAllUserTokens, nil)
}
