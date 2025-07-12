package dto

import (
	"gin-notebook/internal/model"
	"gin-notebook/pkg/utils/tools"
	"time"
)

type WorkspaceNoteDTO struct {
	ID           int64     `json:"id,string"`
	Title        string    `json:"title" validate:"required,min=1,max=100"`
	Content      string    `json:"content"`
	WorkspaceID  int64     `json:"workspace_id,string" validate:"required"`
	CategoryID   int64     `json:"category_id,string" validate:"required"`
	AllowEdit    bool      `json:"allow_edit"`
	AllowComment bool      `json:"allow_comment"`
	AllowShare   bool      `json:"allow_share"`
	Status       string    `json:"status" validate:"omitempty, oneof=public private"`
	AllowJoin    bool      `json:"allow_join"`
	AllowInvite  bool      `json:"allow_invite"`
	OwnerID      int64     `json:"owner_id,string"`
	OwnerName    string    `json:"owner_name"`
	OwnerAvatar  string    `json:"owner_avatar"`
	OwnerEmail   string    `json:"owner_email"`
	IsFavorite   bool      `json:"is_favorite"` // 是否收藏
	CreatedAt    time.Time `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt    time.Time `json:"updated_at" time_format:"2006-01-02"`
	CategoryName string    `json:"category_name"`
	Cover        *string   `json:"cover"` // 笔记封面
}

type WorkspaceUpdateNoteCategoryDTO struct {
	ID           int64  `json:"id,string"`
	CategoryName string `json:"category_name"`
	Total        int64  `json:"total"`
}

type UpdateWorkspaceNoteValidator struct {
	WorkspaceID  int64   `json:"workspace_id,string" validate:"required,gt=0"`
	OwnerID      int64   `json:"owner_id,string" validate:"required,gt=0"`
	NoteID       int64   `json:"note_id,string" validate:"required"`
	Title        *string `json:"title" validate:"omitempty,min=1,max=100"`
	Content      *string `json:"content"`
	CategoryID   *int64  `json:"category_id,string"`
	AllowEdit    *bool   `json:"allow_edit"`
	AllowComment *bool   `json:"allow_comment"`
	AllowShare   *bool   `json:"allow_share"`
	Status       *string `json:"status"`
	AllowJoin    *bool   `json:"allow_join"`
	AllowInvite  *bool   `json:"allow_invite"`
	Cover        *string `json:"cover" validate:"omitempty,url"` // 笔记封面
}

type CreateWorkspaceNoteDTO struct {
	BaseDto
	WorkspaceID  int64             `json:"workspace_id,string" validate:"required,gt=0"`
	OwnerID      int64             `json:"owner_id,string" validate:"required,gt=0"`
	Title        string            `json:"title" validate:"min=1,max=100"`
	Content      *string           `json:"content"`
	CategoryID   int64             `json:"category_id,string" validate:"required,gt=0"`
	AllowEdit    *bool             `json:"allow_edit"`
	AllowComment *bool             `json:"allow_comment"`
	AllowShare   *bool             `json:"allow_share"`
	Status       *model.NoteStatus `json:"status" validate:"omitempty,oneof=private public group"` // 限制状态值范围
	AllowJoin    *bool             `json:"allow_join"`
	AllowInvite  *bool             `json:"allow_invite"`
}

func (dto *CreateWorkspaceNoteDTO) ToModel(ignoredFields []string) *model.Note {
	note := &model.Note{}
	// 使用通用函数复制字段
	tools.CopyFields(dto, note, append(ignoredFields, "Status"))
	// 单独处理枚举类型
	if dto.Status != nil && !tools.Contains(ignoredFields, "Status") {
		note.Status = model.NoteStatus(*dto.Status)
	}
	return note
}

func (v *UpdateWorkspaceNoteValidator) ToUpdate() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, map[string]string{"Status": "status"}, []string{"NoteID"})
	if v.Status != nil {
		updates["status"] = model.NoteStatus(*v.Status)
	}

	return updates
}

type NoteCategoryBaseDTO struct {
	BaseDto
	WorkspaceID  *int64  `json:"workspace_id,string" validate:"omitempty,gt=0"`
	CategoryName *string `json:"category_name" validate:"required,min=1,max=20"`
}

func (v *NoteCategoryBaseDTO) ToMap() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, nil, []string{"ID", "WorkspaceID", "CreatedAt", "UpdatedAt"})
	return updates
}

type UpdateNoteCategoryDTO struct {
	NoteCategoryBaseDTO
	ID int64 `json:"id,string" validate:"required,gt=0"`
}

type DeleteNoteCategoryDTO struct {
	OwnerID     *int64 `json:"owner_id,string"`
	ID          int64  `json:"note_id,string" validate:"required,gt=0"`
	WorkspaceID int64  `json:"workspace_id,string" validate:"required,gt=0"`
}

type CreateNoteCategoryDTO struct {
	BaseDto
	CategoryName string `json:"category_name" validate:"required,min=1,max=20"`
	WorkspaceID  int64  `json:"workspace_id,string" validate:"required"`
}

func (v *CreateNoteCategoryDTO) ToModel() *model.NoteCategory {
	return &model.NoteCategory{
		WorkspaceID:  v.WorkspaceID,
		CategoryName: v.CategoryName,
	}
}

type RecommendNoteCategoryQueryDTO struct {
	WorkspaceID int64 `form:"workspace_id,string" validate:"required"`
}

type RecommendNoteCategoryDTO struct {
	Hot    *[]model.NoteCategory `json:"hot"`
	Recent *[]model.NoteCategory `json:"recent"`
}

type NoteCategoryQueryDTO struct {
	WorkspaceID  int64  `form:"workspace_id,string" validate:"required"`
	CategoryName string `form:"kw" validate:"omitempty,min=1,max=20"`
}

type FavoriteNoteDTO struct {
	NoteID     int64 `json:"note_id,string" validate:"required,gt=0"`
	UserID     int64 `json:"user_id,string" validate:"required,gt=0"`
	IsFavorite *bool `json:"is_favorite" validate:"required"` // 是否收藏
	Sep        int64 `json:"sep" validate:"required,gt=0"`    // 收藏顺序
}

type FavoriteNoteQueryDTO struct {
	UserID      int64  `form:"user_id,string" validate:"required,gt=0"`
	WorkspaceID int64  `form:"workspace_id,string" validate:"required,gt=0"`
	Limit       int    `form:"limit" validate:"omitempty,gt=0"`
	Offset      int    `form:"offset" validate:"omitempty,gt=0,lt=30"`
	Order       string `form:"order" validate:"omitempty,oneof=asc desc"`                       // 排序方式
	OrderBy     string `form:"order_by" validate:"omitempty,oneof=title created_at updated_at"` // 排序字段
}

type FavoriteNoteListDTO struct {
	OwnerID        int64     `json:"owner_id,string"`
	OwnerNickame   string    `json:"owner_nickname"`
	OwnerEmail     string    `json:"owner_email"`
	OwnerAvatar    string    `json:"owner_avatar"`
	NoteTitle      string    `json:"note_title"`
	NoteID         int64     `json:"note_id,string"`
	NoteContent    string    `json:"note_content"`
	NoteCategory   string    `json:"note_category"`
	NoteCategoryID int64     `json:"note_category_id,string"`
	NoteTag        string    `json:"note_tag"`
	NoteTagID      int64     `json:"note_tag_id,string"`
	CreatedAt      time.Time `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt      time.Time `json:"updated_at" time_format:"2006-01-02"`
	IsFavorite     bool      `json:"is_favorite"` // 是否收藏
}

type CreateTemplateNoteDTO struct {
	OwnerID  int64   `validate:"required,gt=0"`
	Content  string  `json:"content" validate:"required,min=1"`
	Title    string  `json:"title" validate:"required,min=1,max=100"`
	IsPublic *bool   `json:"is_public" validate:"omitempty"`
	Cover    *string `json:"cover" validate:"omitempty,url"`
}

type TemplateNote struct {
	ID        int64        `json:"id,string"`
	User      UserBreifDTO `json:"user"`
	Content   string       `json:"content"`
	Title     string       `json:"title"`
	IsPublic  *bool        `json:"is_public"`
	Cover     *string      `json:"cover"`
	CreatedAt time.Time    `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt time.Time    `json:"updated_at" time_format:"2006-01-02"`
}

type GetTemplateNotesDTO struct {
	UserID   int64   `validate:"required,gt=0"`
	Keywords *string `form:"keywords" validate:"omitempty,min=1,max=100"`
	OrderBy  *string `form:"order_by" validate:"omitempty,oneof=created_at updated_at title"`
	Limit    *int    `form:"limit" validate:"omitempty,gt=0,lt=20"`
	Offset   int     `form:"offset" validate:"omitempty,gte=0"`
}
