package model

type AISession struct {
	BaseModel
	UserID int64  `json:"user_id" gorm:"not null;index:idx_user_id"`                                      // User ID
	Title  string `json:"title" gorm:"type:varchar(50);not null;index:idx_title;default:undefined title"` // Session title
}

type AIMessage struct {
	BaseModel
	SessionID int64  `json:"session_id" gorm:"not null;index:idx_session_index,unique"`                 // 会话 ID
	UserID    int64  `json:"user_id" gorm:"not null;index:idx_user_id"`                                 // 用户 ID
	Content   string `json:"content" gorm:"not null;type:text"`                                         // 对话内容
	Role      string `json:"role" gorm:"type:varchar(20);not null;index:idx_role"`                      // 角色: user 或 assistant
	Index     int64  `json:"index"    gorm:"not null;index:idx_session_index,unique"`                   // 顺序号
	Status    string `json:"status" gorm:"type:varchar(20);not null;default:complete;index:idx_status"` // 状态: complete, loading 等
}
