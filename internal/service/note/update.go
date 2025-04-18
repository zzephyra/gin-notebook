package note

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func UpdateNote(params *dto.UpdateWorkspaceNoteValidator) (responseCode int, data any) {
	// Implement the logic to update the note in the database
	// This typically involves querying the database for the note by ID,
	// updating its fields with the provided values, and saving the changes.
	// The actual implementation will depend on your database and ORM setup.

	err := repository.UpdateNote(params.NoteID, params.ToUpdate())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}

	responseCode = message.SUCCESS
	return
}

func UpdateNoteCategory(params *dto.UpdateWorkspaceNoteCategoryDTO) (responseCode int, data any) {
	// Implement the logic to update the note category in the database
	// This typically involves querying the database for the category by ID,
	// updating its fields with the provided values, and saving the changes.
	// The actual implementation will depend on your database and ORM setup.
	err := repository.UpdateNoteCategory(params.ID, params.ToMap())
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	return
}
