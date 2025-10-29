package model

import (
	"strconv"
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
	Title        string         `json:"title" gorm:"not null; type:varchar(255); index:idx_title"`
	Content      datatypes.JSON `json:"content" gorm:"type:jsonb;not null;default:'[]'::jsonb;index:idx_content"`
	WorkspaceID  int64          `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	TagsID       int64          `json:"tags_id" gorm:"default:NULL; index:idx_tags_id"`
	CategoryID   int64          `json:"category_id" gorm:"default:NULL; index:idx_category_id"`
	OwnerID      int64          `json:"owner_id" gorm:"not null; index:idx_owner_id"`
	AllowEdit    *bool          `json:"allow_edit" gorm:"default:true"`
	AllowComment *bool          `json:"allow_comment" gorm:"default:true"`
	AllowShare   *bool          `json:"allow_share" gorm:"default:true"`
	Status       NoteStatus     `json:"status" gorm:"default:'private'; index:idx_status"`
	AllowJoin    *bool          `json:"allow_join" gorm:"default:true"`
	AllowInvite  *bool          `json:"allow_invite" gorm:"default:true"`
	Cover        *string        `json:"cover" gorm:"default:NULL; type:text;"`
	NotionPageID *string        `json:"notion_page_id" gorm:"-"` // 方便前端展示
	Version      int64          `gorm:"type:bigint;not null;default:0"`
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
	Content  datatypes.JSON `json:"content" gorm:"type:jsonb;not null;default:'[]'::jsonb;index:idx_content"`
	Title    string         `json:"title" gorm:"not null; type:varchar(255); index:idx_title"`
	OwnerID  int64          `json:"owner_id" gorm:"not null; index:idx_owner_id"`
	IsPublic *bool          `json:"is_public" gorm:"default:false"`
	Cover    *string        `json:"cover" gorm:"default:NULL; type:text;"`
}

type NoteExternalLink struct {
	NoteID int64 `gorm:"not null; index"`

	Provider IntegrationProvider  `gorm:"type:varchar(32); not null"`
	ResType  ExternalResourceType `gorm:"type:varchar(32); not null; default:'page'"`

	TargetNoteID  string  `gorm:"type:varchar(255); not null; index"`
	TargetNoteURL *string `gorm:"type:text"`

	MemberID int64 `gorm:"not null; index"`

	Mode            SyncMode       `gorm:"type:varchar(16); not null; default:'auto'"`
	Direction       SyncDirection  `gorm:"type:varchar(16); not null; default:'both'"`
	ConflictPolicy  ConflictPolicy `gorm:"type:varchar(16); not null; default:'latest'"`
	LastStatus      SyncStatus     `gorm:"type:varchar(16); not null; default:'idle'; index"`
	InitStatus      InitStatus     `gorm:"type:varchar(16); not null; default:'pending'; index"` // ★ 新增字段
	LastError       *string        `gorm:"type:text"`
	IsActive        bool           `gorm:"not null; default:true; index"`
	LastSyncedAt    *time.Time
	ExternalVersion *string `gorm:"type:varchar(255)"`
	ExternalETag    *string `gorm:"type:varchar(255)"`
	Meta            datatypes.JSON
	SyncHash        *string `gorm:"type:varchar(64); index"`
	ScheduleTaskID  *int64  `gorm:"index"`
	ContentVersion  int64   `gorm:"type:bigint;not null;default:0"`
	BaseModel
}

func (n *NoteExternalLink) Data() map[string]interface{} {
	return map[string]interface{}{
		"id":              strconv.FormatInt(n.ID, 10),
		"note_id":         strconv.FormatInt(n.NoteID, 10),
		"provider":        n.Provider,
		"res_type":        n.ResType,
		"target_note_id":  n.TargetNoteID,
		"target_note_url": n.TargetNoteURL,
		"member_id":       strconv.FormatInt(n.MemberID, 10),
		"mode":            n.Mode,
		"direction":       n.Direction,
		"conflict_policy": n.ConflictPolicy,
		"last_status":     n.LastStatus,
		"last_error":      n.LastError,
		"is_active":       n.IsActive,
		"last_synced_at":  n.LastSyncedAt,
		"created_at":      n.CreatedAt,
		"updated_at":      n.UpdatedAt,
	}
}

type NoteExternalNodeMapping struct {
	NoteID            int64               `gorm:"uniqueIndex:idx_note_provider_block;not null"`                   // 本地 note
	Provider          IntegrationProvider `gorm:"type:varchar(16);uniqueIndex:idx_note_provider_block;not null"`  // 平台
	NodeUID           string              `gorm:"type:varchar(36);not null"`                                      // 本地粘性ID（建议 ≥ 12位）
	ExternalDocID     string              `gorm:"type:varchar(128);index;not null"`                               // 归属外部文档
	ExternalBlockID   string              `gorm:"type:varchar(128);uniqueIndex:idx_note_provider_block;not null"` // 外部块ID（Feishu block_id / Notion block_id）
	LocalNodeType     string              `gorm:"type:varchar(32)"`                                               // 本地类型（paragraph/heading/...）
	ExternalBlockType string              `gorm:"type:varchar(32)"`                                               // 外部类型（heading_1/paragraph/...）
	ParentUID         string              `gorm:"type:varchar(36);index"`                                         // 本地父节点
	ExternalParentID  string              `gorm:"type:varchar(36);index"`                                         // 外部父块
	OrderIndex        int                 `gorm:"index"`                                                          // 兄弟序
	// 同步状态
	SyncStatus   SyncStatus `gorm:"type:varchar(16);default:'synced'"` // synced/pending/error
	LastError    string     `gorm:"type:text"`
	LastSyncedAt time.Time  `gorm:"index"`
	// 平台特有的块属性（如 Notion annotations、Feishu image_token 等）
	ExtMeta datatypes.JSON `gorm:"type:json"`
	// 乐观并发（可选）
	ETag string `gorm:"type:varchar(64)"` // 外部版本戳/指纹
	BaseModel
}
