package uploadService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/thirdparty/qiniu"
)

func GetUploadPolicy() (responseCode int, data map[string]interface{}) {
	var storageDriver string
	data = make(map[string]interface{})
	systemSettingsData, err := cache.RedisInstance.GetCachedSystemSettings()
	if err != nil {
		responseCode = message.ERROR_DATABASE
		return
	}

	storageDriver = systemSettingsData["storage_driver"]
	if storageDriver == "" {
		systemSettingsModel, err := repository.GetSystemSettings()
		if err != nil {
			responseCode = message.ERROR_DATABASE
			return
		}

		storageDriver = systemSettingsModel.StorageDriver
	}

	switch storageDriver {
	case "qiniu":
		service := qiniu.GetQiniuService()
		token, err := service.UploadToken()
		if err != nil {
			responseCode = message.ERROR_QINIU_TOKEN
			return
		}
		data["driver"] = "qiniu"
		data["token"] = token
	default:
		responseCode = message.ERROR_STORAGE_DRIVER_NOT_SUPPORT
		return
	}

	responseCode = message.SUCCESS
	return
}
