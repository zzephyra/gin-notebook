package dto

type AIRequestDTO struct {
	Messages         []map[string]any `json:"messages" validate:"required"`
	IsSearchInternet bool             `json:"isSearchInternet"`
}

type AIHttpRequestDTO struct {
	Messages []map[string]any `json:"messages"`
	Stream   bool             `json:"stream"`
	Model    string           `json:"model"`
}

type AISettingsDTO struct {
	Model  string `json:"ai_model"`
	ApiKey string `json:"ai_api_key"`
	ApiUrl string `json:"ai_api_url"`
}

type AIMessageParamsDTO struct {
	SessionID *int64  `json:"session_id,string" validate:"omitempty"`
	Content   string  `json:"content" validate:"required"`
	Role      string  `json:"role" validate:"required,oneof=user assistant"`
	Status    string  `json:"status" validate:"required,oneof=complete loading error incomplete"` // 状态: complete, loading, error
	UserID    int64   `json:"-" validate:"required"`                                              // 用户 ID
	Title     *string `json:"title" validate:"omitempty,min=1,max=50"`                            // 会话标题
	Action    string  `json:"action" validate:"required,oneof=init insert reset"`                 // 操作类型
	ParentID  int64   `json:"parentID,string" validate:"omitempty"`
}

type AIMessageResponseDTO struct {
	SessionID int64 `json:"session_id,string"` // 会话 ID
	MessageID int64 `json:"message_id,string"` // 消息 ID
}

type AIHistoryChatParamsDTO struct {
	UserID int64 `json:"-" validate:"required"`            // 用户 ID
	Offset int   `form:"offset" validate:"omitempty,gt=0"` // 偏移量
	// Limit  int64 `json:"limit" validate:"omitempty,gt=0,lte=30"` // 限制条数，默认 20，最大 30
}

type AIHistoryDeleteParamsDTO struct {
	SessionID string `form:"id,string" validate:"required"` // 会话 ID
	UserID    int64  `json:"-" validate:"required"`         // 用户 ID
}

type AIMessageDTO struct {
	Content string `json:"content"`   // 消息内容
	Role    string `json:"role"`      // 角色: user 或 assistant
	Index   int64  `json:"index"`     // 顺序号
	ID      int64  `json:"id,string"` // 消息 ID
	// SessionID int64  `json:"session_id,string"` // 会话 ID
	CreatedAt string `json:"created_at"`       // 消息创建时间
	Status    string `json:"status"`           // 状态: complete, loading 等
	ParentID  int64  `json:"parent_id,string"` // 父消息 ID，用于回复
}

type AIHistoryChatDTO struct {
	ID    int64  `json:"id,string" validate:"required"` // 会话 ID
	Title string `json:"title"`                         // 会话标题
}

type AIHistoryChatResponseDTO struct {
	Sessions []AIHistoryChatDTO `json:"sessions"` // 会话列表
	Total    int64              `json:"total"`    // 会话总数
}

type AIHistoryUpdateParamsDTO struct {
	SessionID int64   `json:"-" validate:"required"`                   // 会话 ID
	UserID    int64   `json:"-" validate:"required"`                   // 用户 ID
	Title     *string `json:"title" validate:"omitempty,min=1,max=50"` // 会话标题
}

type AISessionParamsDTO struct {
	SessionID int64 `validate:"omitempty"` // 会话 ID
	UserID    int64 `validate:"required"`  // 用户 ID
}

type AISessionResponseDTO struct {
	Title    string         `json:"title"`    // 会话标题
	Messages []AIMessageDTO `json:"messages"` // 消息列表
}
type AIMessageUpdateParamsDTO struct {
	SessionID *int64 `json:"session_id,string" validate:"required"` // 会话 ID
	MessageID int64  `json:"-" validate:"required"`                 // 消息 ID
	Content   string `json:"content" validate:"required"`
	Role      string `json:"role" validate:"required,oneof=assistant"`
	Status    string `json:"status" validate:"required,oneof=complete loading error incomplete"` // 状态: complete, loading, error
	UserID    int64  `json:"user_id" validate:"required"`                                        // 用户 ID
	Action    string `json:"action" validate:"required,oneof=init insert reset"`                 // 操作类型
}
