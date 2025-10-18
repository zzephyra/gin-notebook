package types

import "gin-notebook/pkg/utils/tools"

const SyncNoteKey = "note:sync"

type SyncNotePayload struct {
	NoteID       int64         `json:"note_id" validate:"required"`
	MemberID     int64         `json:"member_id" validate:"required"`
	UserID       int64         `json:"user_id" validate:"required"`
	WorkspaceID  int64         `json:"workspace_id" validate:"required"`
	OldIndex     tools.MDIndex `json:"old_index" validate:"required"`
	TargetNoteID string        `json:"target_note_id" validate:"required"`
}
