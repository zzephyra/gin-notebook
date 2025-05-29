package noteService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"

	"github.com/jinzhu/copier"
)

func CreateNoteCategory(params *dto.CreateNoteCategoryDTO) (responseCode int, data any) {
	categroyModel := params.ToModel()
	_, err := repository.CreateNoteCategory(categroyModel)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	data = categroyModel
	return
}

func CreateNote(dto *dto.CreateWorkspaceNoteDTO) (responseCode int, data *dto.CreateWorkspaceNoteDTO) {
	noteModel := dto.ToModel([]string{})

	_, err := repository.CreateNote(noteModel)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	dto.ID = &noteModel.ID
	dto.Content = &noteModel.Content

	responseCode = message.SUCCESS
	data = dto
	return
}

func SetFavoriteNote(params *dto.FavoriteNoteDTO) (responseCode int, data any) {
	favoriteNoteModel := model.FavoriteNote{}
	copier.Copy(&favoriteNoteModel, params)

	logger.LogInfo("设置笔记收藏", map[string]interface{}{
		"user_id":     favoriteNoteModel.UserID,
		"note_id":     favoriteNoteModel.NoteID,
		"is_favorite": favoriteNoteModel.IsFavorite,
	})
	err := repository.SetFavoriteNote(&favoriteNoteModel)
	if err != nil {
		errCode := database.IsError(err)
		responseCode = errCode
		return
	}

	responseCode = message.SUCCESS
	return
}
