package note

import "gin-notebook/internal/http/message"

type UpdateWorkspaceNoteParams struct {
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

func UpdateNote(params *UpdateWorkspaceNoteParams) (responseCode int, data any) {
	// Implement the logic to update the note in the database
	// This typically involves querying the database for the note by ID,
	// updating its fields with the provided values, and saving the changes.
	// The actual implementation will depend on your database and ORM setup.
	
	responseCode = message.SUCCESS
	return 
}