package model

import (
	"time"
)

type Project struct {
	BaseModel
	Name        string `json:"name" gorm:"not null; type:varchar(100); index:idx_name"`
	Description string `json:"description" gorm:"type:text"`
	OwnerID     int64  `json:"owner_id,string" gorm:"not null; index:idx_owner_id"`
	WorkspaceID int64  `json:"workspace_id,string" gorm:"not null; index:idx_workspace_id"`
	Status      string `json:"status" gorm:"default:'active'; index:idx_status"` // active, archived, completed
}

type ToDoColumn struct {
	BaseModel
	ProjectID   int64  `json:"project_id,string" gorm:"not null; index:idx_project_id"`
	Name        string `json:"name" gorm:"not null; type:varchar(100); index:idx_name"`
	Description string `json:"description" gorm:"type:text"`
	Order       string `json:"order" gorm:""`                          // 用于排序
	ProcessID   uint8  `json:"process_id" gorm:"index:idx_process_id"` // 用于流程管理，区分统计项目进度，释放名称自定义
}

type ToDoTask struct {
	BaseModel
	ProjectID   int64      `json:"project_id,string" gorm:"not null; index:idx_project_id"`
	Title       string     `json:"title" gorm:"not null; type:varchar(200); index:idx_title"`
	Order       string     `json:"order" gorm:"index:uniq_column_order,priority:2"`
	ColumnID    int64      `json:"column_id,string" gorm:"index:uniq_column_order,priority:1"`
	Creator     int64      `json:"creator,string" gorm:"not null; index:idx_creator"`
	Priority    string     `json:"priority" gorm:"index:idx_priority"` // low, medium, high
	Status      string     `json:"status" gorm:"index:idx_status"`     // pending, in_progress, completed
	Description string     `json:"description" gorm:"type:text"`       // 任务描述
	Deadline    *time.Time `json:"deadline"`                           // 任务截止时间
}

type ToDoTaskAssignee struct {
	BaseModel
	AssigneeID int64 `json:"assignee_id,string" gorm:"index:idx_assignee"`                // 任务负责人
	ToDoTaskID int64 `json:"todo_task_id,string" gorm:"not null; index:idx_todo_task_id"` // 任务ID
}
