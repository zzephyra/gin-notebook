package asynqimpl

import (
	"gin-notebook/internal/tasks/asynq/handlers"
	"gin-notebook/internal/tasks/asynq/types"

	"github.com/hibiken/asynq"
)

func NewMux() *asynq.ServeMux {
	mux := asynq.NewServeMux()
	mux.HandleFunc(string(types.TypeEmailSend), handlers.HandleEmailSend)
	mux.HandleFunc(string(types.KanbanActivityKey), handlers.KanbanActivity)
	mux.HandleFunc(types.TypeFeishuRefreshAllUserTokens, handlers.HandleFeishuRefreshAllUserTokens)
	mux.HandleFunc(types.InitSyncNoteKey, handlers.HandleInitSyncNote)
	mux.HandleFunc(types.SyncDeltaKey, handlers.HandleSyncDelta)
	mux.HandleFunc(types.IngestNoteKey, handlers.HandleIngestNote)
	mux.HandleFunc(types.EmbedChunkKey, handlers.HandleEmbedChunk)
	return mux
}
