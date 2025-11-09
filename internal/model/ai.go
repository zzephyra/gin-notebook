package model

import (
	"strconv"
	"time"

	"github.com/pgvector/pgvector-go"
	"gorm.io/datatypes"
)

type AISession struct {
	BaseModel
	MemberID int64  `json:"member_id" gorm:"not null;index:idx_member_id"`                                  // User ID
	Title    string `json:"title" gorm:"type:varchar(50);not null;index:idx_title;default:undefined title"` // Session title

	SystemPrompt string         `json:"system_prompt" gorm:"type:text;not null;default:''"`    // 会话级系统提示
	Settings     datatypes.JSON `json:"settings"      gorm:"type:jsonb;not null;default:'{}'"` // {model, temperature, top_p, top_k, max_ctx, retrieve_k ...}
	Memory       datatypes.JSON `json:"memory"        gorm:"type:jsonb;default:'{}'"`          // 长期记忆/标签/SUMMARY
}

type AIMessage struct {
	BaseModel
	SessionID int64  `json:"session_id" gorm:"not null;index:idx_session_index,unique"`                 // 会话 ID
	MemberID  int64  `json:"member_id" gorm:"not null;index:idx_member_id"`                             // 用户 ID
	Content   string `json:"content" gorm:"not null;type:text"`                                         // 对话内容
	Role      string `json:"role" gorm:"type:varchar(20);not null;index:idx_role"`                      // 角色: user 或 assistant
	Index     int64  `json:"index"    gorm:"not null;index:idx_session_index,unique"`                   // 顺序号
	Status    string `json:"status" gorm:"type:varchar(20);not null;default:complete;index:idx_status"` // 状态: complete, loading 等
	ParentID  int64  `json:"parent_id" gorm:""`

	Model     string          `json:"model"       gorm:"type:varchar(64)"`
	TokensIn  int             `json:"tokens_in"`
	TokensOut int             `json:"tokens_out"`
	Meta      datatypes.JSON  `json:"meta"        gorm:"type:jsonb;default:'{}'"`
	Embedding pgvector.Vector `json:"embedding"  gorm:"type:vector(512)"` // 维度按你的embedding模型改// 父消息 ID，用于回复
}

type AiPrompt struct {
	Intent      string         `json:"intent" gorm:"type:varchar(64);not null;uniqueIndex:idx_intent"`
	PromptName  *string        `json:"prompt_name" gorm:"type:varchar(128)"`
	Template    string         `json:"template" gorm:"type:text;not null"`
	Language    string         `json:"language" gorm:"type:varchar(8);not null;default:zh;index"`
	Model       *string        `json:"model" gorm:"type:varchar(64)"`
	PromptType  PromptType     `json:"prompt_type" gorm:"type:varchar(32);not null;default:system"`
	Variables   datatypes.JSON `json:"variables" gorm:"type:jsonb"`
	Version     int            `json:"version" gorm:"not null;default:1"`
	IsActive    bool           `json:"is_active" gorm:"not null;default:true;index"`
	Description *string        `json:"description" gorm:"type:text"`
	Metadata    datatypes.JSON `json:"metadata" gorm:"type:jsonb"`
	BaseModel
}

func (AiPrompt) TableName() string { return "ai_prompts" }

type AiPromptVersion struct {
	ID          int64          `json:"id" gorm:"primaryKey"`
	PromptID    int64          `json:"prompt_id" gorm:"not null;index"`
	Version     int            `json:"version" gorm:"not null;index"`
	Template    string         `json:"template" gorm:"type:text;not null"`
	Variables   datatypes.JSON `json:"variables" gorm:"type:jsonb"`
	Description *string        `json:"description" gorm:"type:text"`
	Metadata    datatypes.JSON `json:"metadata" gorm:"type:jsonb"`
	CreatedAt   time.Time      `json:"created_at" gorm:"not null;default:now()"`
}

func (AiPromptVersion) TableName() string { return "ai_prompt_versions" }

type AIActionExposure struct {
	ActionKey            string  `gorm:"type:varchar(64);not null;index:idx_expo_action_key" json:"action_key"`    // 动作标识，与前端注册表对应
	IsDiscoverable       bool    `gorm:"not null;default:true;index:idx_expo_discoverable" json:"is_discoverable"` // 是否在前端显示
	AllowExplicitTrigger bool    `gorm:"not null;default:true" json:"allow_explicit_trigger"`                      // 是否允许显式触发（按钮点击）
	OrderIndex           *string `gorm:"type:varchar(32);index:idx_expo_order" json:"order_index"`                 // 排序字段，LexoRank 格式
	Category             *string `gorm:"type:varchar(64);index:idx_expo_category" json:"category"`                 // 按钮分组类别
	PromptID             *uint64 `gorm:"index:idx_expo_prompt_id" json:"prompt_id"`                                // 绑定的提示词 ID
	TrackLatest          bool    `gorm:"not null;default:true" json:"track_latest"`                                // 是否跟随最新激活版本
	PinnedVersion        *int64  `json:"pinned_version"`                                                           // 固定使用的提示词版本
	UserID               *uint64 `json:"created_by"`                                                               // 创建人 ID
	BaseModel
}

func (AIActionExposure) TableName() string {
	return "ai_action_exposures"
}

func (a *AIActionExposure) Serialization() map[string]interface{} {
	return map[string]interface{}{
		"id":              strconv.FormatInt(a.ID, 10),
		"is_discoverable": a.IsDiscoverable,
		"updated_at":      a.UpdatedAt,
		"category":        a.Category,
		"order_index":     a.OrderIndex,
		"action_key":      a.ActionKey,
	}
}
