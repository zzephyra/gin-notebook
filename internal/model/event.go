package model

import "time"

type Event struct {
	BaseModel
	UserID      int64                  `json:"user_id,string" gorm:"not null;index:idx_user_id"`
	Title       string                 `json:"title" gorm:"not null;type:varchar(255);index:idx_title"`
	Content     string                 `json:"content" gorm:"not null;type:text;index:idx_content"`
	Start       time.Time              `json:"start" gorm:"type:timestamp;not null;index:idx_start_time"`
	End         time.Time              `json:"end" gorm:"type:timestamp;not null;index:idx_end_time"`
	Location    string                 `json:"location" gorm:"type:varchar(255);index:idx_location"`
	Allday      *bool                  `json:"allday" gorm:"default:false"`                            // 是否全天事件
	Visibility  string                 `json:"visiblity" gorm:"default:'public';index:idx_visibility"` // 事件可见性，private, public, group
	Color       string                 `json:"color" gorm:"default:'#3788d8'"`
	RruleType   string                 `json:"rrule_type" gorm:"default:'0';index:idx_rrule_type"`
	Rrule       *string                `json:"rrule" gorm:"type:text"`                                     // 重复规则，使用iCal格式
	Duration    map[string]interface{} `json:"duration" gorm:"type:jsonb"`                                 // 事件持续时间，ISO 8601格式
	WorkspaceID int64                  `json:"workspace_id,string" gorm:"not null;index:idx_workspace_id"` // 工作空间ID
}

type EventReminder struct {
	BaseModel
	EventID          int64  `json:"event_id" gorm:"not null;index:idx_event_id"`
	Reminder         int    `json:"reminder" gorm:"not null"`                  // 提醒时间，单位为分钟
	ReminderAt       string `json:"reminder_at" gorm:"not null;type:datetime"` // 提醒时间点
	NotificationSent bool   `json:"notification_sent" gorm:"default:false"`    // 是否已发送通知
	NotificationType string `json:"notification_type" gorm:"default:'email'"`
	// 通知类型，email, sms, push等
	NotificationContent string `json:"notification_content" gorm:"type:text"` // 通知内容
	// 通知内容，可以是邮件内容、短信内容等
	NotificationStatus string `json:"notification_status" gorm:"default:'pending'"`
	// 通知状态，pending, sent, failed等
	NotificationError string `json:"notification_error" gorm:"type:text"` // 通知错误信息
	// 通知错误信息，如果发送失败，可以记录错误信息
	NotificationSentAt    string `json:"notification_sent_at" gorm:"type:datetime"` // 通知发送时间
	NotificationUserEmail string `json:"notification_user_email" gorm:"type:varchar(255)"`
	// 通知用户邮箱，表示哪个用户需要接收通知
	NotificationUserPhone string `json:"notification_user_phone" gorm:"type:varchar(20)"`
}
