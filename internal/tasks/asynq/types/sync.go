package types

import "gin-notebook/pkg/utils/tools"

const SyncNoteKey = "note:sync"

type SyncNotePayload struct {
	NoteID     int64         `json:"note_id"`
	MemberID   int64         `json:"member_id"`
	OldIndex   tools.MDIndex `json:"old_index"`
	NewContent string        `json:"new_content"`
}
