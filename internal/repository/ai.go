package repository

import (
	"context"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"

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
	result := database.DB.Model(&model.AISession{}).Select("id", "title").Where("user_id = ?", param.UserID).Offset(param.Offset).Limit(limit).Order("created_at DESC").Find(&data)
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

func GetAISessionCount(userID int64) (count int64, err error) {
	result := database.DB.Model(&model.AISession{}).Where("user_id = ?", userID).Count(&count)
	if result.Error != nil {
		err = result.Error
		return
	}
	return
}

func DeleteAISessionByID(sessionID string, userID int64) error {
	result := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ? AND user_id = ?", sessionID, userID).Delete(&model.AISession{}).Error; err != nil {
			return err
		}
		if err := tx.Where("session_id = ?", sessionID).Delete(&model.AIMessage{}).Error; err != nil {
			return err
		}
		return nil
	})
	return result
}

func UpdateAISession(tx *gorm.DB, sessionID int64, userID int64, updateData map[string]interface{}) error {
	result := tx.Model(&model.AISession{}).Where("id = ? AND user_id = ?", sessionID, userID).Updates(updateData)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no session found")
	}

	return nil
}

func GetAISessionByID(sessionID int64, userID int64) (data *model.AISession, err error) {
	session := &model.AISession{}
	result := database.DB.Model(session).Where("id = ? AND user_id = ?", sessionID, userID).First(session)
	if result.Error != nil {
		err = result.Error
		return
	}
	data = session
	return
}

func GetAIMessageBySessionID(sessionID int64, userID int64) (messages []dto.AIMessageDTO, err error) {
	result := database.DB.Model(&model.AIMessage{}).
		Select("content", "role", "index", "created_at", "status").
		Where("session_id = ? AND user_id = ?", sessionID, userID).
		Order("index ASC").
		Scan(&messages)

	if result.Error != nil {
		err = result.Error
		return
	}
	return
}
