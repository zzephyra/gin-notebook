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

func CreateTemplateNote(params *dto.CreateTemplateNoteDTO) (responseCode int, data *dto.TemplateNote) {
	templateNote := model.TemplateNote{}
	copier.Copy(&templateNote, params)

	err := repository.CreateTemplateNote(database.DB, &templateNote)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}

	responseCode = message.SUCCESS
	data = &dto.TemplateNote{
		ID:        templateNote.ID,
		Title:     templateNote.Title,
		Content:   templateNote.Content,
		IsPublic:  templateNote.IsPublic,
		Cover:     templateNote.Cover,
		CreatedAt: templateNote.CreatedAt,
		UpdatedAt: templateNote.UpdatedAt,
	}
	return
}

func GetTemplateNotes(params *dto.GetTemplateNotesDTO) (responseCode int, data *dto.ListResultDTO[dto.TemplateNote]) {
	templateNotes, total, err := repository.GetTemplateNotes(database.DB, params.UserID, params.Limit, params.Offset)

	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	if templateNotes == nil {
		return
	}
	userID := make([]int64, 0)

	for note := range *templateNotes {
		userID = append(userID, (*templateNotes)[note].OwnerID)
	}

	users, err := repository.GetUserByIDs(userID)
	if err != nil {
		logger.LogError(err, "获取用户信息失败")
		responseCode = message.ERROR_DATABASE
		return
	}

	userMap := make(map[int64]dto.UserBreifDTO, len(*users))

	for _, user := range *users {
		userMap[user.ID] = dto.UserBreifDTO{
			ID:       user.ID,
			Nickname: *user.Nickname,
			Email:    user.Email,
			Avatar:   user.Avatar,
		}
	}

	notes := make([]dto.TemplateNote, 0, len(*templateNotes))
	for note := range *templateNotes {
		notes = append(notes, dto.TemplateNote{
			ID:        (*templateNotes)[note].ID,
			Title:     (*templateNotes)[note].Title,
			Content:   (*templateNotes)[note].Content,
			IsPublic:  (*templateNotes)[note].IsPublic,
			Cover:     (*templateNotes)[note].Cover,
			CreatedAt: (*templateNotes)[note].CreatedAt,
			UpdatedAt: (*templateNotes)[note].UpdatedAt,
			User:      userMap[(*templateNotes)[note].OwnerID],
		})
	}

	data = &dto.ListResultDTO[dto.TemplateNote]{
		Data:  notes,
		Total: total,
	}
	responseCode = message.SUCCESS
	return
}
