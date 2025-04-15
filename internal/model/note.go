package model

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
	Share        bool       `json:"share" gorm:"default:false"`
	AllowEdit    bool       `json:"allow_edit" gorm:"default:true"`
	AllowComment bool       `json:"allow_comment" gorm:"default:true"`
	AllowShare   bool       `json:"allow_share" gorm:"default:true"`
	Status       NoteStatus `json:"status" gorm:"default:'private'; index:idx_status"`
	AllowJoin    bool       `json:"allow_join" gorm:"default:true"`
	AllowInvite  bool       `json:"allow_invite" gorm:"default:true"`
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
