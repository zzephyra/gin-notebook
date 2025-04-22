package repository

import (
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/logger"
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

func GetNoteCategory(workspaceID int64) (*[]dto.WorkspaceUpdateNoteCategoryDTO, error) {
	var notesCategory []dto.WorkspaceUpdateNoteCategoryDTO
	logger.LogDebug("获取工作区笔记分类:", map[string]interface{}{
		"workspace_id": workspaceID,
	})
	err := database.DB.
		Table("note_categories").
		Select("note_categories.id, note_categories.category_name , COUNT(notes.id) as total").
		Joins("LEFT JOIN notes ON notes.category_id = note_categories.id AND notes.workspace_id = ?", workspaceID).
		Where("note_categories.workspace_id = ?", workspaceID).
		Limit(-1).
		Group("note_categories.id, note_categories.category_name").
		Scan(&notesCategory).Error
	if err != nil {
		return nil, err
	}
	return &notesCategory, nil
}

func UpdateNote(NoteID int64, data map[string]interface{}) (err error) {
	err = database.DB.Model(&model.Note{}).Where("id = ?", NoteID).Updates(data).Error
	return
}

func CreateNote(note *model.Note) (int64, error) {
	err := database.DB.Create(note).Error
	if err != nil {
		return 0, err
	}
	return note.ID, nil
}

func CreateNoteCategory(noteCategory *model.NoteCategory) (int64, error) {
	err := database.DB.Create(noteCategory).Error
	if err != nil {
		return 0, err
	}
	return noteCategory.ID, nil
}

func UpdateNoteCategory(noteCategoryID int64, data map[string]interface{}) error {
	err := database.DB.Model(&model.NoteCategory{}).Where("id = ?", noteCategoryID).Updates(data).Error
	if err != nil {
		return err
	}
	return nil
}
