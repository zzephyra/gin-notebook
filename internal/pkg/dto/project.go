package dto

import (
	"gin-notebook/internal/model"
)

type UpdateAssigneeDTO struct {
	ActionAdd    []string `json:"action_add"`
	ActionRemove []string `json:"action_remove"` // 任务负责人ID列表
}

type TaskEditableDTO struct {
	Title           *string            `json:"title" validate:"omitempty"`
	Order           *string            `json:"order" validate:"omitempty"`
	ColumnID        *int64             `json:"column_id,string" validate:"omitempty"`
	Creator         *int64             `json:"creator" validate:"omitempty"`
	Priority        *string            `json:"priority" validate:"omitempty"`    // low, medium, high
	Status          *string            `json:"status" validate:"omitempty"`      // pending, in_progress, completed
	Description     *string            `json:"description" validate:"omitempty"` // 任务描述
	Deadline        *Date              `json:"deadline" validate:"omitempty"`
	AssigneeActions *UpdateAssigneeDTO `json:"assignee_actions" validate:"omitempty"` // 任务负责人变更操作
}

func (t TaskEditableDTO) HasTaskFieldUpdates() bool {
	return t.Title != nil ||
		t.Order != nil ||
		t.ColumnID != nil ||
		t.Creator != nil ||
		t.Priority != nil ||
		t.Status != nil ||
		t.Description != nil ||
		t.Deadline != nil
}

func (p ProjectTaskDTO) IsAssigneeOnlyUpdate() bool {
	return p.Payload.AssigneeActions != nil && !p.Payload.HasTaskFieldUpdates()
}

type ProjectTaskDTO struct {
	ProjectID   int64           `json:"project_id,string" validate:"required,gt=0"`
	ColumnID    int64           `json:"column_id,string" validate:"required,gt=0"` // 列ID
	OrderHint   string          `json:"order_hint" validate:"omitempty"`
	AfterID     int64           `json:"after_id,string" validate:"omitempty"`
	BeforeID    int64           `json:"before_id,string" validate:"omitempty"`
	TaskID      int64           `validate:"omitempty"` // 任务ID
	Payload     TaskEditableDTO `json:"payload" validate:"required"`
	WorkspaceID int64           `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	Creator     int64           `validate:"required,gt=0"`                            // 创建者ID
}

type ListProjectsDTO struct {
	WorkspaceID int64 `form:"workspace_id,string" validate:"required,gt=0"`
	UserID      int64 `validate:"required,gt=0"` // 用户ID
}

type GetProjectDTO struct {
	ProjectID   int64 `validate:"required,gt=0"`                            // 项目ID
	WorkspaceID int64 `form:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	UserID      int64 `validate:"required,gt=0"`                            // 用户ID
}

type ToDoTaskWithFlag struct {
	model.ToDoTask
	Rn         int `gorm:"column:rn"`
	TotalCount int `gorm:"column:total_count"`
}

type ToDoTaskAssignee struct {
	ToDoTaskID int64 `json:"to_do_task_id,string"` // 任务ID
	UserBreifDTO
	WorkspaceNickname string `json:"workspace_nickname"` // 工作空间昵称
}

func (t ToDoTaskAssignee) UserBreif() UserBreifDTO {
	nickname := t.Nickname
	if t.WorkspaceNickname != "" {
		nickname = t.WorkspaceNickname
	}
	return UserBreifDTO{
		ID:       t.ID,
		Nickname: nickname,
		Email:    t.Email,
		Avatar:   t.Avatar,
	}
}
