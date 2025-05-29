package noteService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func DeleteNote(params *dto.DeleteNoteCategoryDTO) (responseCode int, data any) {
	err := repository.DeleteNote(params.ID)
	if err != nil {
		return message.ERROR_NOTE_DELETE, nil
	}
	responseCode = message.SUCCESS
	return
}
