package dto

import (
	"time"

	"github.com/teambition/rrule-go"
	"gorm.io/datatypes"
)

type CreateEventParamsDTO struct {
	UserID      int64     `json:"-" validate:"required,gt=0"`                                              // 用户ID
	Title       string    `json:"title" validate:"required,max=100"`                                       // 事件标题
	Content     string    `json:"content" validate:"max=500"`                                              // 事件描述
	Start       time.Time `json:"start" validate:"required"`                                               // 事件开始时间
	End         time.Time `json:"end" validate:"required"`                                                 // 事件结束时间
	Location    string    `json:"location" validate:"max=200"`                                             // 事件地点
	Color       string    `json:"color" validate:"omitempty,max=20,startswith=#"`                          // 事件颜色
	Reminder    int       `json:"reminder" validate:"gte=0"`                                               // 提醒时间，单位为分钟
	Allday      *bool     `json:"allday" validate:"omitempty"`                                             // 是否全天事件
	RruleType   string    `json:"rrule_type" validate:"required_with=Rrule,omitempty,oneof=0 1 2 3 4 5 6"` // 是否为重复事件
	Rrule       *string   `json:"rrule" validate:"omitempty,rrule"`                                        // 是否为重复事件
	Duration    Duration  `json:"duration" validate:"required_with=Rrule,omitempty,duration"`              // 事件持续时间
	WorkspaceID int64     `json:"workspace_id,string" validate:"required"`                                 // 工作空间ID

}

type GetEventListParamsDTO struct {
	WorkspaceID int64     `form:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	From        time.Time `form:"from" validate:"required"`                     // 查询开始时间
	To          time.Time `form:"to" validate:"required"`                       // 查询结束时间
	OwnerID     *int64    `form:"owner_id,string" validate:"omitempty,gt=0"`    // 查询用户ID,如果不传则查询所有用户的事件
	UserID      int64     `json:"-" validate:"required"`                        // 登陆用户ID
}

type EventsListDTO struct {
	Events []EventDTO `json:"events"` // 事件列表
	Total  int        `json:"total"`  // 事件总数
}

type EventDTO struct {
	ID           int64              `json:"id,string"`     // 事件ID
	UserID       int64              `json:"user_id"`       // 用户ID
	UserNickname string             `json:"user_nickname"` // 用户昵称
	UserEmail    string             `json:"user_email"`    // 用户邮箱
	Title        string             `json:"title"`         // 事件标题
	Content      string             `json:"content"`       // 事件描述
	Start        time.Time          `json:"start"`         // 事件开始时间
	End          time.Time          `json:"end"`           // 事件结束时间
	Location     string             `json:"location"`      // 事件地点
	Color        string             `json:"color"`         // 事件颜色
	AllDay       *bool              `json:"allday"`        // 是否全天事件
	RruleType    string             `json:"rrule_type"`    // 重复事件类型
	Rrule        *string            `json:"rrule"`         // 重复规则
	Duration     *datatypes.JSONMap `json:"duration"`      // 事件持续时间
}

func (e *EventDTO) RruleValidator(from, to time.Time) bool {
	if e.Rrule == nil || *e.Rrule == "" {
		return true // 如果没有重复规则，则认为验证通过
	}

	eventRrule := *e.Rrule
	r, err := rrule.StrToRRule(eventRrule)
	if err != nil {
		return false // 如果解析失败，返回验证不通过
	}

	occurrences := r.Between(from, to, true)
	return len(occurrences) > 0 // 如果在指定时间范围内有重复事件，则验证通过
}

type Duration struct {
	Hours   int `json:"hours"`
	Minutes int `json:"minutes"`
}

type UpdateEventParamsDTO struct {
	ID          int64      `json:"-" validate:"required,gt=0"`                                              // 事件ID
	UserID      int64      `json:"-" validate:"required,gt=0"`                                              // 用户ID
	Title       *string    `json:"title" validate:"omitempty,max=100"`                                      // 事件标题
	Content     *string    `json:"content" validate:"omitempty,max=500"`                                    // 事件描述
	Start       *time.Time `json:"start" validate:"omitempty"`                                              // 事件开始时间
	End         *time.Time `json:"end" validate:"omitempty"`                                                // 事件结束时间
	Location    *string    `json:"location" validate:"omitempty,max=200"`                                   // 事件地点
	Color       *string    `json:"color" validate:"omitempty,max=20,startswith=#"`                          // 事件颜色
	AllDay      *bool      `json:"allday" validate:"omitempty"`                                             // 是否全天事件
	RruleType   string     `json:"rrule_type" validate:"required_with=Rrule,omitempty,oneof=0 1 2 3 4 5 6"` // 是否为重复事件
	Rrule       *string    `json:"rrule" validate:"omitempty,rrule"`                                        // 是否为重复事件
	Duration    *Duration  `json:"duration" validate:"omitempty,duration"`                                  // 事件持续时间
	WorkspaceID int64      `json:"workspace_id,string" validate:"required"`                                 // 工作空间ID
}
