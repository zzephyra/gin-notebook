package model

import (
	"time"

	"gorm.io/datatypes"
)

type ScheduledTask struct {
	UserID   uint64         `gorm:"index"`    // 可选，若按用户管理
	TaskType string         `gorm:"size:128"` // e.g. "email:send"
	TaskID   string         `gorm:"size:64"`  // asynq one-time task ID
	EntryID  string         `gorm:"size:128"` // asynq scheduler entry id (for cron tasks)
	CronExpr string         `gorm:"size:64"`  // 如果是周期任务，保存表达式
	RunAt    *time.Time     // 如果是一次性任务，保存执行时间
	Status   string         `gorm:"size:32"`    // pending | active | canceled | done
	Payload  datatypes.JSON `gorm:"type:jsonb"` // 可选：序列化payload（json）
	BaseModel
}
