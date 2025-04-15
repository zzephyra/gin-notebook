package repository

import (
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
)

func GetNotesList(workspaceID string, userID int64, limit int, offset int) (*[]dto.WorkspaceNoteDTO, error) {
	var notes []dto.WorkspaceNoteDTO
	err := database.DB.
		Table("notes").
		Select("notes.*, users.email AS owner_email").
		Joins("LEFT JOIN users ON users.id = notes.owner_id").
		Limit(limit).
		Offset(offset).
		Where("workspace_id = ? AND owner_id = ?", workspaceID, userID).
		Scan(&notes).Error
	if err != nil {
		return nil, err
	}
	return &notes, nil
}

func GetNoteCategoryMap() (*[]model.NoteCategory, error) {
	var notesCategory []model.NoteCategory
	err := database.DB.
		Table("note_categories").
		Select("note_categories.id, note_categories.category_name").
		Limit(-1).
		Scan(&notesCategory).Error
	if err != nil {
		return nil, err
	}
	return &notesCategory, nil
}

func GetNoteCategory(workspaceID int64) (*[]dto.WorkspaceNoteCategoryDTO, error) {
	var notesCategory []dto.WorkspaceNoteCategoryDTO
	err := database.DB.
		Table("notes").
		Select("notes.category_id as id, note_categories.category_name , COUNT(*) as total").
		Joins("LEFT JOIN note_categories ON notes.category_id = note_categories.id").
		Where("notes.workspace_id = ?", workspaceID).
		Limit(-1).
		Group("notes.category_id, note_categories.category_name").
		Scan(&notesCategory).Error
	if err != nil {
		return nil, err
	}
	return &notesCategory, nil
}

func UpdateNote(NoteID int64, data map[string]interface{})(err error){
	err = database.DB.Model(&model.Note{}).Where("id = ?", NoteID).Updates(data).Error
	return
}