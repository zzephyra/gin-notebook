package types

const EmbedChunkKey = "chunk:embed"

type EmbedChunkPayload struct {
	DocumentID int64 `json:"document_id"`
}
