package eventService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func GetEventsList(params *dto.GetEventListParamsDTO) (responseCode int, data *dto.EventsListDTO) {
	events, err := repository.GetEvents(database.DB, params.WorkspaceID, params.From, params.To, params.OwnerID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}
	data = &dto.EventsListDTO{
		Events: events,
		Total:  len(events),
	}
	responseCode = message.SUCCESS
	return
}
