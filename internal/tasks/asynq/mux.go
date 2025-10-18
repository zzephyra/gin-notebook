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
	mux.HandleFunc(types.SyncNoteKey, handlers.HandleSyncNote)
	return mux
}
