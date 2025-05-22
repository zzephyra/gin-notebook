package dto

import (
	"time"

	"gorm.io/datatypes"
)

type WorkspaceListDTO struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name"`
	Owner         int64     `json:"owner"`
	OwnerAvatar   string    `json:"owner_avatar"`
	OwnerNickname string    `json:"owner_name"`
	OwnerEmail    string    `json:"owner_email"`
	OwnerPhone    string    `json:"owner_phone"`
	Description   string    `json:"description"`
	AllowInvite   bool      `json:"allow_invite"`
	AllowJoin     bool      `json:"allow_join"`
	AllowPublic   bool      `json:"allow_public"`
	AllowShare    bool      `json:"allow_share"`
	AllowComment  bool      `json:"allow_comment"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	DeletedAt     time.Time `json:"deleted_at"`
}

type WorkspaceValidation struct {
	Name         string `json:"name" validate:"required,min=1,max=100,alphanumunicode"`
	Description  string `json:"description" validate:"omitempty,max=1000"`
	Owner        int64  `json:"owner" validate:"required,gt=0"`
	AllowInvite  *bool  `json:"allow_invite" validate:"omitempty"`
	AllowJoin    *bool  `json:"allow_join" validate:"omitempty"`
	AllowPublic  *bool  `json:"allow_public" validate:"omitempty"`
	AllowShare   *bool  `json:"allow_share" validate:"omitempty"`
	AllowComment *bool  `json:"allow_comment" validate:"omitempty"`
	UUID         string `json:"uuid" validate:"omitempty,uuid4"`
	Expire       string `json:"expire" validate:"omitempty"`
}

type WorkerMemberValidation struct {
	WorkspaceID int64  `validate:"required,gt=0"`     // 必须存在，并且大于0
	UserID      int64  `validate:"required,gt=0"`     // 必须存在，并且大于0
	Role        string `validate:"required"`          // 必须存在
	Nickname    string `validate:"omitempty,max=100"` // 可选字段，长度限制
}

type WorkspaceDTO struct {
	ID            int64          `json:"id"`
	Name          string         `json:"name"`
	Owner         int64          `json:"owner"`
	OwnerAvatar   string         `json:"owner_avatar"`
	OwnerNickname string         `json:"owner_name"`
	OwnerEmail    string         `json:"owner_email"`
	OwnerPhone    string         `json:"owner_phone"`
	Description   string         `json:"description"`
	AllowInvite   bool           `json:"allow_invite"`
	AllowJoin     bool           `json:"allow_join"`
	AllowPublic   bool           `json:"allow_public"`
	AllowShare    bool           `json:"allow_share"`
	AllowComment  bool           `json:"allow_comment"`
	Roles         datatypes.JSON `json:"roles"`
	Editable      bool           `json:"editable"`
}
