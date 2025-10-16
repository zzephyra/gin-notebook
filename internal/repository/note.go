package repository

import (
	"context"
	"errors"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/logger"
	"strings"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GetNotesList(workspaceID string, userID int64, limit int, offset int) (*[]dto.WorkspaceNoteDTO, error) {
	var notes []dto.WorkspaceNoteDTO
	err := database.DB.
		Table("notes").
		Select(
			`notes.*, users.email AS owner_email, 
			CASE 
				WHEN fn.is_favorite IS NULL THEN false 
				ELSE fn.is_favorite 
			END AS is_favorite`).
		Joins("LEFT JOIN users ON users.id = notes.owner_id").
		Joins("LEFT JOIN favorite_notes as fn ON fn.note_id = notes.id AND fn.user_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Where("workspace_id = ? AND owner_id = ? AND notes.deleted_at is NULL", workspaceID, userID).
		Scan(&notes).Error
	if err != nil {
		return nil, err
	}
	return &notes, nil
}

func GetNoteByID(db *gorm.DB, ctx context.Context, workspaceID int64, noteID int64) (*model.Note, error) {
	var note model.Note
	err := database.DB.
		Model(&model.Note{}).
		Where("id = ? AND workspace_id = ? AND deleted_at is NULL", noteID, workspaceID).
		Find(&note).Error
	if err != nil {
		return nil, err
	}

	return &note, nil
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

func GetNoteCategory(params *dto.NoteCategoryQueryDTO) (*[]dto.WorkspaceUpdateNoteCategoryDTO, error) {
	var notesCategory []dto.WorkspaceUpdateNoteCategoryDTO
	logger.LogDebug("获取工作区笔记分类:", map[string]interface{}{
		"workspace_id": params.WorkspaceID,
	})
	query := database.DB.
		Table("note_categories").
		Select("note_categories.id, note_categories.category_name , COUNT(notes.id) as total")

	if params.CategoryName != "" {
		name := strings.ReplaceAll(params.CategoryName, "%", "")
		name = strings.ReplaceAll(name, "_", "")
		query = query.Where("note_categories.category_name LIKE ?", "%"+name+"%")
	}

	err := query.Joins("LEFT JOIN notes ON notes.category_id = note_categories.id AND notes.workspace_id = ?", params.WorkspaceID).
		Where("note_categories.workspace_id = ?", params.WorkspaceID).
		Limit(-1).
		Group("note_categories.id, note_categories.category_name").
		Scan(&notesCategory).Error
	if err != nil {
		return nil, err
	}
	return &notesCategory, nil
}

func UpdateNote(db *gorm.DB, NoteID int64, updatedAt string, data map[string]interface{}) (conflict bool, err error) {
	sql := db.Debug().Model(&model.Note{}).Where("id = ? and updated_at = ?", NoteID, updatedAt).Updates(data)

	if sql.RowsAffected == 0 {
		conflict = true
		err = errors.New("update conflict")
		return
	}

	if sql.Error != nil {
		err = sql.Error
		return
	}
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

func DeleteNote(noteID int64) error {
	err := database.DB.Delete(&model.Note{}, noteID).Error
	return err
}

func GetCategories(workspaceID int64, orderBy string, limit int, conditions []QueryCondition) (*[]model.NoteCategory, error) {
	var categories []model.NoteCategory
	// 字段白名单（仅允许这些字段参与筛选）
	validFields := map[string]bool{
		"creator_id":  true,
		"status":      true,
		"created_at":  true,
		"is_archived": true,
	}

	// 操作符白名单
	validOps := map[string]bool{
		"=": true, "<": true, "<=": true, ">": true, ">=": true,
		"IN": true, "LIKE": true, "NOT IN": true, "NOT LIKE": true,
	}

	query := database.DB.Table("note_categories").Where("workspace_id = ?", workspaceID)

	// 动态追加条件
	for _, cond := range conditions {
		if !validFields[cond.Field] || !validOps[strings.ToUpper(cond.Operator)] {
			continue // 忽略非法条件
		}

		switch strings.ToUpper(cond.Operator) {
		case "IN":
			query = query.Where(fmt.Sprintf("%s IN ?", cond.Field), cond.Value)
		case "LIKE":
			query = query.Where(fmt.Sprintf("%s LIKE ?", cond.Field), cond.Value)
		default:
			query = query.Where(fmt.Sprintf("%s %s ?", cond.Field, cond.Operator), cond.Value)
		}
	}

	if orderBy != "" && validFields[orderBy] {
		query = query.Order(orderBy + " DESC")
	}

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Scan(&categories).Error
	if err != nil {
		return nil, err
	}
	return &categories, nil
}

func GetRecentCreatedCategories(workspaceID int64, limit int) (*[]model.NoteCategory, error) {
	filter := []QueryCondition{
		{
			Field:    "created_at",
			Operator: ">=",
			Value:    time.Now().AddDate(0, 0, -7), // 7天内创建的
		},
	}

	return GetCategories(workspaceID, "created_at", limit, filter)
}

func GetFrequentUsedCategories(workspaceID int64, limit int) (*[]model.NoteCategory, error) {
	return GetCategories(workspaceID, "updated_at", limit, nil)
}

func SetFavoriteNote(favoriteNote *model.FavoriteNote) error {
	logger.LogInfo("设置笔记收藏", map[string]interface{}{
		"user_id":     favoriteNote.UserID,
		"note_id":     favoriteNote.NoteID,
		"is_favorite": favoriteNote.IsFavorite,
	})

	return database.DB.
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}, {Name: "note_id"}},
			DoUpdates: []clause.Assignment{
				{Column: clause.Column{Name: "is_favorite"}, Value: gorm.Expr("EXCLUDED.is_favorite")},
				{Column: clause.Column{Name: "sep"}, Value: gorm.Expr("EXCLUDED.sep")},
			},
			Where: clause.Where{Exprs: []clause.Expression{
				gorm.Expr("favorite_notes.sep < EXCLUDED.sep"),
			}},
		}).
		Create(favoriteNote).Error
}

func GetFavoriteNoteList(params *dto.FavoriteNoteQueryDTO) (*[]dto.WorkspaceNoteDTO, error) {
	var favoriteNotes = []dto.WorkspaceNoteDTO{}
	query := database.DB.Table("favorite_notes").
		Select(`
			favorite_notes.is_favorite, 
			users.id as owner_id,
			users.nickname as owner_name,
			users.email as owner_email,
			users.avatar as owner_avatar,
			notes.*
		`).
		Joins("LEFT JOIN notes ON notes.id = favorite_notes.note_id").
		Joins("LEFT JOIN users ON users.id = notes.owner_id").
		Order(fmt.Sprintf("notes.%s %s", params.OrderBy, strings.ToUpper(params.Order))).
		Where("notes.deleted_at is Null and favorite_notes.user_id = ? and notes.workspace_id = ? and favorite_notes.is_favorite = True", params.UserID, params.WorkspaceID).
		Offset(params.Offset).Limit(params.Limit)
	err := query.Scan(&favoriteNotes).Error
	return &favoriteNotes, err
}

func GetFavoriteNoteCount(userID int64, workspaceID int64) (int64, error) {
	var count int64
	err := database.DB.Table("favorite_notes").
		Joins("LEFT JOIN notes ON notes.id = favorite_notes.note_id").
		Where("notes.deleted_at is NULL AND favorite_notes.user_id = ? AND notes.workspace_id = ? AND favorite_notes.is_favorite = True", userID, workspaceID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func CreateTemplateNote(db *gorm.DB, templateNote *model.TemplateNote) error {
	err := db.Create(&templateNote).Error
	if err != nil {
		return err
	}
	return nil
}

func GetTemplateNotes(db *gorm.DB, userID int64, limit *int, offset int) (*[]model.TemplateNote, int64, error) {
	var templateNotes []model.TemplateNote
	var count int64
	sql := db.Model(&model.TemplateNote{}).
		Where("owner_id = ?", userID).
		Offset(offset)

	if limit != nil {
		sql = sql.Limit(*limit)
	}
	sql.Count(&count)
	err := sql.Order("created_at DESC").Find(&templateNotes).Error

	if err != nil {
		return nil, 0, err
	}
	return &templateNotes, count, nil
}

func GetNoteSyncList(db *gorm.DB, ctx context.Context, memberID int64, noteID *int64, provider *model.IntegrationProvider) (*[]model.NoteExternalLink, int64, error) {
	var syncPolicies []model.NoteExternalLink
	var count int64
	query := db.Model(&model.NoteExternalLink{}).
		Where("member_id = ?", memberID)

	if noteID != nil {
		query = query.Where("note_id = ?", *noteID)
	}

	if provider != nil && *provider != "" {
		query = query.Where("provider = ?", *provider)
	}

	query.Count(&count)

	err := query.Order("created_at DESC").Find(&syncPolicies).Error
	if err != nil {
		return nil, 0, err
	}
	return &syncPolicies, count, nil
}

func GetNoteIndexJSON(db gorm.DB, ctx context.Context, noteID int64) (datatypes.JSON, error) {
	var n model.Note
	// 假设你的 Note 模型里字段名为 MdAstIndex（datatypes.JSON）
	if err := db.WithContext(ctx).
		Select("id, md_index").
		First(&n, "id = ?", noteID).Error; err != nil {
		return nil, err
	}
	return n.MDIndex, nil
}

func GetNoteMappingByNoteAndProvider(db *gorm.DB, ctx context.Context, noteID int64, provider model.IntegrationProvider) (*[]model.NoteExternalNodeMapping, error) {
	var mappings []model.NoteExternalNodeMapping
	err := db.WithContext(ctx).
		Where("note_id = ? AND provider = ?", noteID, provider).
		Find(&mappings).Error
	if err != nil {
		return nil, err
	}
	return &mappings, nil
}
