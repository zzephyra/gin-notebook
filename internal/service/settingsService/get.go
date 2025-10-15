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
		var systemSettingModel *model.SystemSetting
		if err != nil {
			logger.LogInfo("获取缓存的系统设置", map[string]interface{}{
				"data": cachedSystemSettingsData,
			})
			systemSettingModel = &model.SystemSetting{}
			if err := tools.ConvertCacheToModel(cachedSystemSettingsData, systemSettingModel); err == nil {
				logger.LogDebug("获取缓存的系统设置", map[string]interface{}{
					"systemSettingModel": systemSettingModel,
				})
			} else {
				logger.LogError(err, "系统设置转换失败")
			}
		} else {
			systemSettingModel, err = repository.GetSystemSettings()
			if err != nil {
				logger.LogError(err, "获取系统设置失败")
				responseCode = message.ERROR_SYSTEM_SETTINGS_GET
				return
			}
			cache.RedisInstance.SaveSystemSettings(tools.StructToUpdateMap(systemSettingModel, nil, []string{}))

		}
		if systemSettingModel != nil {
			Roles := params.Roles
			_, isExist := tools.Find(Roles, model.UserRole.Admin)
			if isExist {
				data["system"] = tools.StructToUpdateMap(systemSettingModel, nil, []string{"CreatedAt", "UpdatedAt", "ID"})
			} else {
				data["system"] = map[string]interface{}{
					"storage_driver": systemSettingModel.StorageDriver,
					"maximun_size":   systemSettingModel.MaximunSize,
					"qiniu_domain":   systemSettingModel.QiniuDomain,
					"qiniu_region":   systemSettingModel.QiniuRegion,
				}
			}
		}
	}
	responseCode = message.SUCCESS
	return
}
