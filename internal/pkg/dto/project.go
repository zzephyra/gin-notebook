package dto

import (
	"gin-notebook/internal/model"
	"time"

	"gorm.io/datatypes"
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
	AfterID         *int64             `json:"after_id,string" validate:"omitempty"`
	BeforeID        *int64             `json:"before_id,string" validate:"omitempty"`
	Cover           NullableString     `json:"cover" validate:"omitempty"` // 任务封面图片
}

func (t TaskEditableDTO) HasTaskFieldUpdates() bool {
	return t.Title != nil ||
		t.Order != nil ||
		t.ColumnID != nil ||
		t.Creator != nil ||
		t.Priority != nil ||
		t.Status != nil ||
		t.Description != nil ||
		t.Deadline != nil ||
		t.Cover.Set
}

func (p ProjectTaskDTO) IsAssigneeOnlyUpdate() bool {
	return p.Payload.AssigneeActions != nil && !p.Payload.HasTaskFieldUpdates()
}

type ProjectTaskDTO struct {
	ProjectID   int64           `json:"project_id,string" validate:"required,gt=0"`
	ColumnID    int64           `json:"column_id,string" validate:"required,gt=0"` // 列ID
	OrderHint   string          `json:"order_hint" validate:"omitempty"`
	TaskID      int64           `validate:"omitempty"` // 任务ID
	Payload     TaskEditableDTO `json:"payload" validate:"required"`
	WorkspaceID int64           `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	Creator     int64           `validate:"required,gt=0"`                            // 创建者ID
	MemberID    int64           `validate:"required,gt=0"`                            // 用户ID
	UpdatedAt   time.Time       `json:"updated_at" validate:"omitempty"`              // 用于乐观锁
	Cover       *string         `json:"cover" validate:"omitempty,max=255"`           // 任务封面图片
}

type ListProjectsDTO struct {
	WorkspaceID int64 `form:"workspace_id,string" validate:"required,gt=0"`
	UserID      int64 `validate:"required,gt=0"` // 用户ID
}

type GetProjectDTO struct {
	ProjectID   int64 `validate:"required,gt=0"`                            // 项目ID
	WorkspaceID int64 `form:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	UserID      int64 `validate:"required,gt=0"`                            // 用户ID
	MemberID    int64 `validate:"required,gt=0"`                            // 用户ID
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

type DeleteProjectColumnDTO struct {
	MemberID    int64 `validate:"required,gt=0"`                            // 用户ID
	WorkspaceID int64 `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	ColumnID    int64 `validate:"required,gt=0"`                            // 列ID
	ProjectID   int64 `json:"project_id,string" validate:"required,gt=0"`   // 项目ID
}

type ColumnEditableDTO struct {
	Name        *string `json:"name" validate:"omitempty"`
	Description *string `json:"description" validate:"omitempty"`
	OrderIndex  *string `json:"order_index" validate:"omitempty"`
	ProcessID   *uint8  `json:"process_id" validate:"omitempty"`
}

type UpdateProjectColumnDTO struct {
	MemberID    int64             `validate:"required,gt=0"`                            // 用户ID
	WorkspaceID int64             `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	ColumnID    int64             `validate:"required,gt=0"`                            // 列ID
	UpdateAt    time.Time         `json:"updated_at" validate:"required"`               // 用于乐观锁
	ProjectID   int64             `json:"project_id,string" validate:"required,gt=0"`   // 项目ID
	Payload     ColumnEditableDTO `json:"payload" validate:"required"`
}

type GetProjectTaskActivityDTO struct {
	MemberID    int64      `validate:"required,gt=0"`                            // 用户ID
	WorkspaceID int64      `form:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	TaskID      int64      `validate:"required,gt=0"`                            // 任务ID
	UserID      int64      `validate:"required,gt=0"`                            // 用户ID
	Limit       int        `form:"limit" validate:"omitempty,min=10,max=30"`     // 每页数量
	Offset      int        `form:"offset" validate:"omitempty,min=0"`            // 偏移量
	Start       *time.Time `form:"start" validate:"omitempty"`                   // 开始时间
	End         *time.Time `form:"end" validate:"omitempty"`                     // 结束时间
}

type KanbanActivityDTO struct {
	ID              int64          `json:"id,string"`
	TaskID          int64          `json:"task_id,string"` // 任务ID
	Member          UserBreifDTO   `json:"member"`
	Action          string         `json:"action"` // 动作类型，如
	MemberID        int64          `json:"-"`
	SummaryKey      string         `json:"summary_key"` // 摘要关键字，如 "title", "status"
	SummaryParams   datatypes.JSON `json:"summary_params"`
	SummaryFallback string         `json:"summary_fallback"`
	MemberNickname  string         `json:"-"`
	UserNickname    string         `json:"-"`
	Avatar          string         `json:"-"`
	Email           string         `json:"-"`
	CreatedAt       time.Time      `json:"created_at"`
}

type DeleteProjectTaskDTO struct {
	MemberID    int64 `validate:"required,gt=0"`                            // 用户ID
	TaskID      int64 `validate:"required,gt=0"`                            // 任务ID
	WorkspaceID int64 `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
}
