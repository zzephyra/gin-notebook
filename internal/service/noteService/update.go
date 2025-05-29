package noteService

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

func UpdateNoteCategory(params *dto.UpdateNoteCategoryDTO) (responseCode int, data any) {

	err := repository.UpdateNoteCategory(params.ID, params.ToMap())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	return
}
