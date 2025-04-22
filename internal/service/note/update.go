package note

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func UpdateNote(params *dto.UpdateWorkspaceNoteValidator) (responseCode int, data any) {
	fmt.Println(params.ToUpdate())
	err := repository.UpdateNote(params.NoteID, params.ToUpdate())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}

	responseCode = message.SUCCESS
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

func UpdateNoteCategory(params *dto.UpdateNoteCategoryDTO) (responseCode int, data any) {

	err := repository.UpdateNoteCategory(params.ID, params.ToMap())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	return
}

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
