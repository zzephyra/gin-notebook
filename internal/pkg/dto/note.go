package dto

import (
	"gin-notebook/internal/model"
	"gin-notebook/pkg/utils/tools"
)

type WorkspaceNoteDTO struct {
	ID           int64  `json:"id"`
	Title        string `json:"title"`
	Content      string `json:"content"`
	WorkspaceID  int64  `json:"workspace_id"`
	CategoryID   int64  `json:"category_id"`
	Share        bool   `json:"share"`
	AllowEdit    bool   `json:"allow_edit"`
	AllowComment bool   `json:"allow_comment"`
	AllowShare   bool   `json:"allow_share"`
	Status       string `json:"status"`
	AllowJoin    bool   `json:"allow_join"`
	AllowInvite  bool   `json:"allow_invite"`
	OwnerID      int64  `json:"owner_id"`
	OwnerName    string `json:"owner_name"`
	OwnerAvatar  string `json:"owner_avatar"`
	OwnerEmail   string `json:"owner_email"`
	OwnerPhone   string `json:"owner_phone"`
}

type WorkspaceNoteCategoryDTO struct {
	ID           int64  `json:"id"`
	CategoryName string `json:"category_name"`
	Total        int64  `json:"total"`
}

type UpdateWorkspaceNoteValidator struct {
	WorkspaceID  int64   `json:"workspace_id" binding:"required"`
	UserID       int64   `json:"user_id" binding:"required"`
	NoteID       int64   `json:"note_id" binding:"required"`
	Title        *string `json:"title"`
	Content      *string `json:"content"`
	CategoryID   *int64  `json:"category_id"`
	Share        *bool   `json:"share"`
	AllowEdit    *bool   `json:"allow_edit"`
	AllowComment *bool   `json:"allow_comment"`
	AllowShare   *bool   `json:"allow_share"`
	Status       *string `json:"status"`
	AllowJoin    *bool   `json:"allow_join"`
	AllowInvite  *bool   `json:"allow_invite"`
}

func (v *UpdateWorkspaceNoteValidator) ToUpdate() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, map[string]string{"Status": "status"}, nil)

	if v.Status != nil {
		updates["status"] = model.NoteStatus(*v.Status)
	}

	return updates
}

type UpdateWorkspaceNoteCategoryDTO struct {
	BaseDto
	WorkspaceID  int64   `json:"workspace_id" binding:"required"`
	CategoryName *string `json:"category_name"`
}

func (v *UpdateWorkspaceNoteCategoryDTO) ToMap() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, nil, []string{"ID", "WorkspaceID", "CreatedAt", "UpdatedAt"})
	return updates
}
