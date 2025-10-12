package model

import (
	"time"

	"gorm.io/datatypes"
)

type NoteStatus string

const (
	Public  NoteStatus = "public"
	Private NoteStatus = "private"
	Group   NoteStatus = "group"
)

type Note struct {
	BaseModel
	Title        string     `json:"title" gorm:"not null; type:varchar(255); index:idx_title"`
	Content      string     `json:"content" gorm:"not null; type:text; index:idx_content"`
	WorkspaceID  int64      `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	TagsID       int64      `json:"tags_id" gorm:"default:NULL; index:idx_tags_id"`
	CategoryID   int64      `json:"category_id" gorm:"default:NULL; index:idx_category_id"`
	OwnerID      int64      `json:"owner_id" gorm:"not null; index:idx_owner_id"`
	AllowEdit    *bool      `json:"allow_edit" gorm:"default:true"`
	AllowComment *bool      `json:"allow_comment" gorm:"default:true"`
	AllowShare   *bool      `json:"allow_share" gorm:"default:true"`
	Status       NoteStatus `json:"status" gorm:"default:'private'; index:idx_status"`
	AllowJoin    *bool      `json:"allow_join" gorm:"default:true"`
	AllowInvite  *bool      `json:"allow_invite" gorm:"default:true"`
	Cover        *string    `json:"cover" gorm:"default:NULL; type:text;"`
	NotionPageID *string    `json:"notion_page_id" gorm:"-"` // 方便前端展示
}

type NoteTag struct {
	BaseModel
	TagName     string `json:"tag_name" gorm:"not null; type:varchar(100);"`
	WorkspaceID int64  `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	OwnerID     int64  `json:"owner_id" gorm:"not null; index:idx_owner_id"`
}

type NoteCategory struct {
	BaseModel
	CategoryName string `json:"category_name" gorm:"not null; type:varchar(100); index:idx_category_name"`
	WorkspaceID  int64  `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	OwnerID      int64  `json:"owner_id" gorm:"not null; index:idx_owner_id"`
}

type FavoriteNote struct {
	ID         int64 `json:"id,string" gorm:"primaryKey"`
	NoteID     int64 `json:"note_id" gorm:"not null; uniqueIndex:uidx_note_user"`
	UserID     int64 `json:"user_id" gorm:"not null; uniqueIndex:uidx_note_user"`
	IsFavorite *bool `json:"is_favorite" gorm:"default:true"`
	Sep        int64 `json:"sep" gorm:"not null; default:0"` // 用于排序
}

type TemplateNote struct {
	BaseModel
	Content  string  `json:"content" gorm:"not null; type:text"`
	Title    string  `json:"title" gorm:"not null; type:varchar(255); index:idx_title"`
	OwnerID  int64   `json:"owner_id" gorm:"not null; index:idx_owner_id"`
	IsPublic *bool   `json:"is_public" gorm:"default:false"`
	Cover    *string `json:"cover" gorm:"default:NULL; type:text;"`
}

type NoteExternalLink struct {
	ID       int64                `gorm:"primaryKey"`
	NoteID   int64                `gorm:"not null; index:idx_note_provider,priority:1"`
	Provider IntegrationProvider  `gorm:"type:varchar(32); not null; index:idx_note_provider,priority:2"`
	ResType  ExternalResourceType `gorm:"type:varchar(32); not null; default:'page'"`
	// Notion 的 page_id / Jira 的 issue_key / GitHub 的 issue_id ...
	ExternalID  string  `gorm:"type:varchar(255); not null; index:idx_provider_external,priority:1"`
	ExternalURL *string `gorm:"type:text"`

	// 谁把这个链接“建”起来的（用谁的 token 同步）
	LinkedByUserID int64 `gorm:"not null; index"`

	// 采用哪个账号（明确指向 IntegrationAccount；避免多人协作时混淆）
	IntegrationAccountID int64 `gorm:"not null; index"`

	// 同步策略与状态
	Policy       SyncPolicy `gorm:"type:varchar(16); not null; default:'two_way'"`
	LastStatus   SyncStatus `gorm:"type:varchar(16); not null; default:'idle'; index"`
	LastError    *string    `gorm:"type:text"`
	LastSyncedAt *time.Time

	// 增量同步元数据（例如 Notion 的 last_edited_time、block version、ETag 等）
	ExternalVersion *string        `gorm:"type:varchar(255)"`
	ExternalETag    *string        `gorm:"type:varchar(255)"`
	Meta            datatypes.JSON `gorm:"type:json"` // 自由扩展（比如 block map 的 hash）

	BaseModel

	// 约束：
	// 1) 同 Note 在同 Provider 上仅 1 条（每个页面绑定唯一 Provider 资源）
	// UNIQUE KEY uniq_note_provider(note_id, provider)
	// 2) 防止重复绑定相同外部资源
	// UNIQUE KEY idx_provider_external(provider, external_id)
}
