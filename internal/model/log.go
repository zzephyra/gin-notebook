package model

import (
	"time"

	"gorm.io/datatypes"
)

// 动作枚举：先覆盖你现有路由涉及的操作
type KanbanAction string

const (
	UpdateAction KanbanAction = "update"
	DeleteAction KanbanAction = "delete"
	MoveAction   KanbanAction = "move"
	CreateAction KanbanAction = "create"
)

// 资源类型枚举：用于统一过滤和扩展
type KanbanTarget string

const (
	TargetColumn     KanbanTarget = "column"
	TargetTask       KanbanTarget = "task"
	TargetComment    KanbanTarget = "comment"
	TargetAttachment KanbanTarget = "attachment"
)

type KanbanActivity struct {
	ImmutableBaseModel

	// 多租户/项目范围
	WorkspaceID int64  `gorm:"not null;index:idx_ws_ts,priority:1;index:idx_proj_ts,priority:1;comment:工作区ID" json:"workspace_id,string"`
	ProjectID   *int64 `gorm:"not null;index:idx_proj_ts,priority:1;comment:项目ID" json:"project_id,string"`

	// 行为人
	ActorID  int64 `gorm:"not null;index;comment:操作者用户ID" json:"actor_id,string"`
	MemberID int64 `gorm:"index;comment:操作者成员ID" json:"member_id,string,omitempty"`
	// 动作与目标
	Action     KanbanAction `gorm:"type:varchar(32);not null;index;comment:动作" json:"action"`
	TargetType KanbanTarget `gorm:"type:varchar(32);not null;index:idx_target,priority:1;comment:资源类型" json:"target_type"`
	TargetID   int64        `gorm:"not null;index:idx_target,priority:2;comment:资源ID(字符串更通用)" json:"target_id"`

	// 便捷外键（查询友好，optional）
	ColumnID   *int64 `gorm:"index;comment:列ID(如相关)" json:"column_id,string,omitempty"`
	TaskID     *int64 `gorm:"index;comment:任务ID(如相关)" json:"task_id,string,omitempty"`
	CommentID  *int64 `gorm:"index;comment:评论ID(如相关)" json:"comment_id,string,omitempty"`
	Attachment *int64 `gorm:"index;comment:附件ID(如相关)" json:"attachment_id,string,omitempty"`

	// 变化摘要（初期先放一个 Patch，后续需要再加 Before/After）
	Field string         `gorm:"type:varchar(64);index;comment:变更的字段" json:"field,omitempty"`
	Patch datatypes.JSON `gorm:"type:jsonb;comment:变更的字段patch(可选);serializer:json" json:"patch,omitempty"`
	// 可读摘要：例如“将任务标题从A改为B”“移动到列：进行中”
	SummaryKey    string            `gorm:"type:varchar(128);index;comment:i18n消息ID(如 audit.task.update_title)" json:"summary_key,omitempty"`
	SummaryParams datatypes.JSONMap `gorm:"type:jsonb;comment:i18n变量(如 {\"title_from\":\"A\",\"title_to\":\"B\"})" json:"summary_params,omitempty"`
	// 可选兜底：当前端缺少翻译时展示（可不存或只存英文）
	SummaryFallback string `gorm:"type:varchar(255);comment:缺翻译时的兜底文案(可选)" json:"summary_fallback,omitempty"`

	// 请求链路（排错用，按需填写）
	RequestID string `gorm:"type:varchar(64);index;comment:请求ID(可选)" json:"request_id,omitempty"`
	IP        string `gorm:"type:varchar(45);comment:IP(可选)" json:"ip,omitempty"`
	UA        string `gorm:"type:varchar(255);comment:User-Agent(可选)" json:"ua,omitempty"`

	// 结果态
	Success    *bool `gorm:"comment:是否成功(可选)" json:"success,omitempty"`
	StatusCode *int  `gorm:"comment:HTTP状态码(可选)" json:"status_code,omitempty"`

	// 时间：常用按租户/项目 + 时间过滤，建联合索引
	CreatedAt time.Time `gorm:"not null;index:idx_ws_ts,priority:2;index:idx_proj_ts,priority:2;comment:创建时间" json:"created_at"`

	// 审计日志不建议软删
	// UpdatedAt/DeletedAt 不需要：日志一经写入不可改
}

func (KanbanActivity) TableName() string { return "kanban_activity" }
