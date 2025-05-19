package settingsService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
)

func GetSystemSettings(params *dto.GetSettingsDTO) (responseCode int, data map[string]interface{}) {
	category := params.Category
	isAll := params.Category == "" || params.Category == "all"
	data = make(map[string]interface{})
	if isAll || category == "system" {
		cachedSystemSettingsData, err := cache.RedisInstance.GetCachedSystemSettings()
		if err != nil {
			logger.LogDebug("获取缓存的系统设置", map[string]interface{}{
				"data": cachedSystemSettingsData,
			})
			systemSettingModel := model.SystemSetting{}
			if err := tools.ConvertCacheToModel(cachedSystemSettingsData, &systemSettingModel); err == nil {
				logger.LogDebug("获取缓存的系统设置", map[string]interface{}{
					"systemSettingModel": systemSettingModel,
				})
				data["system"] = systemSettingModel
			} else {
				logger.LogError(err, "系统设置转换失败")
			}
		} else {
			systemSettingModel, err := repository.GetSystemSettings()
			if err != nil {
				logger.LogError(err, "获取系统设置失败")
				responseCode = message.ERROR_SYSTEM_SETTINGS_GET
				return
			}
			data["system"] = systemSettingModel
			cache.RedisInstance.SaveSystemSettings(tools.StructToUpdateMap(systemSettingModel, nil, []string{}))
		}
	}
	responseCode = message.SUCCESS
	return
}
