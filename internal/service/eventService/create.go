package eventService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"

	"gorm.io/gorm"
)

func CreateEvent(params *dto.CreateEventParamsDTO) (responseCode int, data map[string]interface{}) {
	event := &model.Event{
		Title:       params.Title,
		Content:     params.Content,
		Start:       params.Start,
		End:         params.End,
		UserID:      params.UserID,
		Color:       params.Color,
		Rrule:       params.Rrule,
		Location:    params.Location,
		Duration:    params.Duration,
		WorkspaceID: params.WorkspaceID,
		AllDay:      params.AllDay,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := repository.CreateEvent(tx, event); err != nil {
			responseCode = database.IsError(err)
			return err
		}
		return nil
	})

	if err != nil {
		responseCode = message.ERROR_EVENT_CREATE
		return
	}
	responseCode = message.SUCCESS
	data = map[string]interface{}{
		"id": event.ID,
	}
	return
}
