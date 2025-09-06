package types

import "gin-notebook/internal/tasks/contracts"

const TypeEmailSend contracts.JobKey = "email:send"

type EmailPayload struct {
	To       string         `json:"to"`
	Subject  string         `json:"subject"`
	Template string         `json:"template"`
	Data     map[string]any `json:"data"`
	Meta     Meta           `json:"meta"` // ⬅ 带上 Actor/ReqID等
}

type Meta struct {
	ActorID     string `json:"actor_id,omitempty"`
	RequestID   string `json:"request_id,omitempty"`
	WorkspaceID string `json:"workspace_id,omitempty"`
}
