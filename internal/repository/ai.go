package repository

import (
	"context"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/errorsx"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func CreateAISeesion(tx *gorm.DB, session *model.AISession) error {
	if err := tx.Create(session).Error; err != nil {
		return err
	}
	return nil
}

func CreateAIMessage(tx *gorm.DB, message *model.AIMessage) error {
	if err := tx.Create(message).Error; err != nil {
		return err
	}
	return nil
}

func GetNextIndex(tx *gorm.DB, ctx context.Context, sessionID int64) (int64, error) {
	redisKey := fmt.Sprintf("sess:%d:seq", sessionID)
	if idx, err := cache.RedisInstance.Client.Incr(ctx, redisKey).Result(); err == nil {
		return idx, nil
	}
	var idx int64
	err := tx.Select("COALESCE(MAX(`index`),0)+1").Where("session_id = ?", sessionID).Clauses(clause.Locking{Strength: "UPDATE"}).Scan(&idx).Error
	if err != nil {
		return 0, err
	}
	_ = cache.RedisInstance.Client.Set(ctx, redisKey, idx, 0).Err()
	return idx, err
}

func GetAISessionsByID(param dto.AIHistoryChatParamsDTO) (data []dto.AIHistoryChatDTO, err error) {
	limit := 15 // 默认限制
	fmt.Println("Offset:", param.Offset)
	result := database.DB.Model(&model.AISession{}).Select("id", "title").Where("member_id = ?", param.MemberID).Offset(param.Offset).Limit(limit).Order("created_at DESC").Find(&data)
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

func GetAISessionCount(memberID int64) (count int64, err error) {
	result := database.DB.Model(&model.AISession{}).Where("member_id = ?", memberID).Count(&count)
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

func DeleteAISessionByID(sessionID string, memberID int64) error {
	result := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ? AND member_id = ?", sessionID, memberID).Delete(&model.AISession{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", sessionID).Delete(&model.AIMessage{}).Error; err != nil {
			return err
		}
		return nil
	})
	return result
}

func UpdateAISession(tx *gorm.DB, sessionID int64, memberID int64, updateData map[string]interface{}) error {
	result := tx.Model(&model.AISession{}).Where("id = ? AND member_id = ?", sessionID, memberID).Updates(updateData)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no session found")
	}

	return nil
}

func GetAISessionByID(sessionID int64, memberID int64) (data *model.AISession, err error) {
	session := &model.AISession{}
	result := database.DB.Model(session).Where("id = ? AND member_id = ?", sessionID, memberID).First(session)
	if result.Error != nil {
		err = result.Error
		return
	}
	data = session
	return
}

func GetAIMessageBySessionID(sessionID int64, memberID int64) (messages []dto.AIMessageDTO, err error) {
	result := database.DB.Model(&model.AIMessage{}).
		Select("content", "role", "index", "created_at", "status", "id", "parent_id").
		Where("session_id = ? AND member_id = ?", sessionID, memberID).
		Order("index ASC").
		Scan(&messages)

	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

func GetAIPrompts(ctx context.Context, db *gorm.DB) (prompts []model.AiPrompt, err error) {
	err = db.WithContext(ctx).Model(&model.AiPrompt{}).Find(&prompts).Error
	return
}

func UpdateAIMessage(tx *gorm.DB, messageID int64, memberID int64, updateData map[string]interface{}) error {
	result := tx.Model(&model.AIMessage{}).Where("id = ? AND member_id = ?", messageID, memberID).Updates(updateData)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no message found")
	}

	return nil
}

func GetAIPromptByIntents(ctx context.Context, db *gorm.DB, intent []string) (prompt []model.AiPrompt, err error) {
	query := db.WithContext(ctx).Model(&model.AiPrompt{}).Where("intent IN ?", intent)
	err = query.Scan(&prompt).Error
	return
}

func GetAIPromptByIntent(ctx context.Context, db *gorm.DB, intent string) (prompt model.AiPrompt, err error) {
	err = db.WithContext(ctx).Model(&model.AiPrompt{}).Where("intent = ?", intent).First(&prompt).Error
	return
}

func GetAllIntents(ctx context.Context, db *gorm.DB) (intents []string, err error) {
	err = db.WithContext(ctx).Model(&model.AiPrompt{}).Distinct().Pluck("intent", &intents).Error
	return
}

func GetAllActionActions(ctx context.Context, db *gorm.DB) (prompts []model.AIActionExposure, err error) {
	q := db.WithContext(ctx).Model(&model.AIActionExposure{}).Where("is_discoverable = ?", true)

	switch db.Dialector.Name() {
	case "postgres":
		q = q.Order(clause.Expr{SQL: `order_index COLLATE "C" ASC`})
	case "mysql":
		q = q.Order(clause.Expr{SQL: "order_index COLLATE utf8mb4_bin ASC"})
	default:
		q = q.Order("order_index ASC")
	}

	err = q.Find(&prompts).Error
	return
}

func InsertAiPrompt(tx *gorm.DB, prompt *model.AiPrompt) (err error) {
	sql := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "intent"}},
		DoNothing: true,
	}).Create(prompt)
	if err := sql.Error; err != nil {
		return err
	}

	if sql.RowsAffected == 0 {
		return errorsx.ErrAIPromptExists
	}
	return nil
}

func DeleteAiPromptByID(tx *gorm.DB, ctx context.Context, promptID int64) (err error) {
	sql := tx.Where("id = ?", promptID).WithContext(ctx).Delete(&model.AiPrompt{})
	if err := sql.Error; err != nil {
		return err
	}
	return nil
}

func GetAiPromptByID(tx *gorm.DB, ctx context.Context, promptID int64) (prompt model.AiPrompt, err error) {
	err = tx.WithContext(ctx).Where("id = ?", promptID).First(&prompt).Error
	return
}
