package settingsService

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"strconv"
)

func UpdateSystemSettings(dto *dto.UpdateSystemSettingsDTO) (responseCode int, data any) {
	systemData, err := cache.RedisInstance.GetCachedSystemSettings()
	if err != nil {
		responseCode = message.ERROR_SYSTEM_SETTINGS_GET
		return
	}

	settingID := systemData["id"]
	fmt.Println(systemData)
	if settingID == "" {
		responseCode = message.ERROR_SYSTEM_SETTINGS_NOT_EXIST
		return
	}

	settingIntID, err := strconv.ParseInt(settingID, 10, 64)
	if err != nil {
		responseCode = message.ERROR_ASSERT_TYPE_FAILED
		return
	}

	err = repository.UpdateSystemSettings(settingIntID, dto)
	if err != nil {
		return message.ERROR_SYSTEM_SETTINGS_UPDATE, nil
	}
	responseCode = message.SUCCESS
	return
}
