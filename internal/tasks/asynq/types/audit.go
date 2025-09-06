package types

import (
	"gin-notebook/internal/model"
	"gin-notebook/internal/tasks/contracts"
)

const KanbanActivityKey contracts.JobKey = "kanban:activity"

type FieldChange struct {
	From any `json:"from"`
	To   any `json:"to"`
}

type KanbanActivityPayload struct {
	ActorID   int64  `json:"actor_id"`
	ActorName string `json:"actor_name"`
	MemberID  int64  `json:"member_id"`

	Action     model.KanbanAction `json:"action"`
	TargetType model.KanbanTarget `json:"target_type"`
	TargetID   int64              `json:"target_id"`

	// 可选外键
	ColumnID *int64 `json:"column_id"`
	TaskID   *int64 `json:"task_id"`
	// 可选关联
	ProjectID     *int64 `json:"project_id"`
	WorkspaceID   int64  `json:"workspace_id"`
	AttacchmentID *int64 `json:"attachment_id"`
	CommentID     *int64 `json:"comment_id"`

	OriginData any                    `json:"origin_data"`
	Patch      map[string]interface{} `json:"patch"`

	RequestID string `json:"request_id"`
	IP        string `json:"ip"`
	UA        string `json:"user_agent"`

	Success     *bool `json:"success"`
	SuccessCode *int  `json:"status"`
}
