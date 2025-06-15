package userService

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
)

func GetUserInfo(UserID int64) (responseCode int, data any) {
	user, errCode := repository.GetUserByID(UserID)
	if errCode != 0 {
		fmt.Println("GetUserByID error code:", errCode)
		return errCode, nil
	}
	return message.SUCCESS, user
}

func UpdateUserInfo(params *dto.UserUpdateDTO) (responseCode int, data any) {
	userUpdateData := tools.StructToUpdateMap(params, nil, []string{"ID"})
	if err := repository.UpdateUser(params.ID, userUpdateData); err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}

func CreateUserDevice(params *dto.UserDeviceCreateDTO) (responseCode int, data any) {
	if err := repository.CreateUserDevice(params); err != nil {
		logger.LogError(err, "create user device error")
		responseCode = message.ERROR_CREATE_USER_DEVICE
		return
	}
	responseCode = message.SUCCESS
	return
}

func GetUserDeviceList(params *dto.UserDeviceListDTO) (responseCode int, data map[string]interface{}) {
	userDevices, total, err := repository.GetUserDeviceList(
		map[string]interface{}{
			"user_id": params.UserID,
		},
		params.Limit,
		params.Offset,
	)
	if err != nil {
		logger.LogError(err, "get user device list error")
		responseCode = message.ERROR_GET_USER_DEVICE_LIST
		return
	}
	responseCode = message.SUCCESS
	data = map[string]interface{}{
		"total":   total,
		"devices": userDevices,
	}
	return
}
