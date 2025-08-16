package eventService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
)

func UpdateEvent(params *dto.UpdateEventParamsDTO) (responseCode int) {
	updateData := tools.StructToUpdateMap(params, nil, []string{"UserID", "WorkspaceID", "ID"})
	logger.LogInfo("UpdateEventApi: updateData", updateData)
	if err := repository.UpdateEvent(database.DB, params.ID, updateData); err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	return
}
