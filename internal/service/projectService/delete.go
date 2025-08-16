package projectService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func DeleteTaskComment(params *dto.DeleteTaskCommentDTO) (responseCode int) {
	comment := &model.ToDoTaskComment{
		BaseModel: model.BaseModel{
			ID: params.CommentID,
		},
		ToDoTaskID: params.TaskID,
		MemberID:   params.MemberID,
	}
	err := repository.DeleteModel(database.DB, comment)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}
	return message.SUCCESS
}
