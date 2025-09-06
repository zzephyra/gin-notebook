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
	return mux
}
