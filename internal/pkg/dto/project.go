package dto

import (
	"gin-notebook/internal/model"
	"time"
)

type UpdateAssigneeDTO struct {
	ActionAdd    []string `json:"action_add"`
	ActionRemove []string `json:"action_remove"` // 任务负责人ID列表
}

type TaskEditableDTO struct {
	Title           *string            `json:"title" gorm:"not null; type:varchar(200); index:idx_title"`
	Order           *string            `json:"order" gorm:"index:uniq_column_order,priority:2"`
	ColumnID        *int64             `json:"column_id,string" gorm:"index:uniq_column_order,priority:1"`
	Creator         *int64             `json:"creator" gorm:"not null; index:idx_creator"`
	Priority        *string            `json:"priority" gorm:"default:'medium'; index:idx_priority"` // low, medium, high
	Status          *string            `json:"status" gorm:"default:'pending'; index:idx_status"`    // pending, in_progress, completed
	Description     *string            `json:"description" gorm:"type:text"`                         // 任务描述
	Deadline        *time.Time         `json:"deadline"`
	AssigneeActions *UpdateAssigneeDTO `json:"assignee_actions,omitempty"` // 任务负责人变更操作
}

type ProjectTaskDTO struct {
	ProjectID   int64           `json:"project_id,string" validate:"required,gt=0"`
	ColumnID    int64           `json:"column_id,string" validate:"required,gt=0"` // 列ID
	OrderHint   string          `json:"order_hint" validate:"omitempty"`
	AfterID     int64           `json:"after_id,string" validate:"omitempty"`
	BeforeID    int64           `json:"before_id,string" validate:"omitempty"`
	TaskID      int64           `json:"-" validate:"omitempty"` // 任务ID
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
