package types

const IngestNoteKey = "note:sync"
const (
	QIngest = "ingest"
	QEmbed  = "embed"
)

type IngestNotePayload struct {
	NoteID      int64 `json:"note_id"`
	WorkspaceID int64 `json:"workspace_id"`
	OwnerUserID int64 `json:"owner_user_id"`
	Version     int64 `json:"version,omitempty"` // 可选：你的 notes.version
}
