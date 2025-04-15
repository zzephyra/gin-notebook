package model

import (
	"time"
)

type MemberRoleStructure struct {
	Admin string
	User  string
}

var MemberRole = MemberRoleStructure{
	Admin: "admin",
	User:  "user",
}

type Workspace struct {
	BaseModel
	Name         string `json:"name" gorm:"not null; index:idx_name"`
	Description  string `json:"description" gorm:"default:NULL"`
	Owner        int64  `json:"owner" gorm:"not null; index:idx_owner"`
	AllowInvite  bool   `json:"allow_invite" gorm:"default:true"`
	AllowJoin    bool   `json:"allow_join" gorm:"default:true"`
	AllowPublic  bool   `json:"allow_public" gorm:"default:true"`
	AllowShare   bool   `json:"allow_share" gorm:"default:true"`
	AllowComment bool   `json:"allow_comment" gorm:"default:true"`
}

type WorkspaceMember struct {
	BaseModel
	WorkspaceID int64  `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	UserID      int64  `json:"user_id" gorm:"not null; index:idx_user_id"`
	Role        string `json:"role" gorm:"not null; default:'member'"`
	Nickname    string `json:"nickname" gorm:"default:NULL"`
	Editable    bool   `json:"editable" gorm:"default:true"`
}

type WorkspaceInvite struct {
	BaseModel
	WorkspaceID int64     `json:"workspace_id" gorm:"not null; index:idx_workspace_id"`
	UUID        string    `json:"uuid" gorm:"not null; index:idx_invite_uuid"`
	Count       int8      `json:"count" gorm:"default:0"`
	ExpiresAt   time.Time `json:"expires_at"`
}