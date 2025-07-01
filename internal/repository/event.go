package repository

import (
	"database/sql"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"time"

	"gorm.io/gorm"
)

func CreateEvent(tx *gorm.DB, event *model.Event) error {
	if err := tx.Create(event).Error; err != nil {
		return err
	}
	return nil
}

func GetEvents(tx *gorm.DB, workspaceID int64, from, to time.Time, OwnerID *int64) ([]dto.EventDTO, error) {
	var oriEvent []dto.EventDTO
	sql := tx.Model(&model.Event{}).
		Select(`events.*, users.nickname as user_nickname, users.email as user_email`).
		Joins("JOIN users on users.id = events.user_id").
		Where("workspace_id = ?", workspaceID).
		Where(`
            (start < @to AND "end" >= @from) OR 
            (rrule IS NOT NULL AND rrule != '')`,
			sql.Named("from", from),
			sql.Named("to", to))

	if OwnerID != nil {
		sql = sql.Where("user_id = ?", *OwnerID)
	}

	if err := sql.Scan(&oriEvent).Error; err != nil {
		return nil, err
	}

	var events []dto.EventDTO
	for _, event := range oriEvent {
		if event.RruleValidator(from, to) {
			events = append(events, event)
			continue
		}
	}
	return events, nil
}

func UpdateEvent(tx *gorm.DB, eventID int64, data map[string]interface{}) error {
	if err := tx.Model(&model.Event{}).Where("id = ?", eventID).Updates(data).Error; err != nil {
		return err
	}
	return nil
}
