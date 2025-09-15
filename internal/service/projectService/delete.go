package projectService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"

	"gorm.io/gorm"
)

func DeleteTaskComment(params *dto.DeleteTaskCommentDTO) (responseCode int) {
	comment := &model.ToDoTaskComment{
		BaseModel: model.BaseModel{
			ImmutableBaseModel: model.ImmutableBaseModel{
				ID: params.CommentID,
			},
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

func CleanColumnTasks(params *dto.DeleteProjectColumnDTO) (responseCode int) {
	err := repository.DeleteProjectColumnTasksByID(database.DB, params.ColumnID, params.ProjectID, false)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	return
}

func DeleteTaskCommentLike(params *dto.DeleteLikeTaskCommentDTO) (responseCode int) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		action, err := repository.DeleteCommentLike(tx, params.CommentID, params.MemberID)
		if err != nil {
			return err
		}

		dLikes, dDislikes := 0, 0
		if action == "unlike" {
			dLikes = -1
		} else if action == "undislike" {
			dDislikes = -1
		}

		_, err = repository.IncCommentCounters(tx, params.CommentID, dLikes, dDislikes)
		return err
	})

	if err != nil {
		responseCode = database.IsError(err)
		return
	}
	return message.SUCCESS
}

func DeleteProjectTask(params *dto.DeleteProjectTaskDTO) (responseCode int) {
	err := repository.DeleteProjectTaskByID(database.DB, params.TaskID, params.WorkspaceID, params.MemberID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	return
}
