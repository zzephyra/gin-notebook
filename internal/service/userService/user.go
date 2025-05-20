package userService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/tools"
)

func GetUserInfo(UserID int64) (responseCode int, data any) {
	user, errCode := repository.GetUserByID(UserID)
	if errCode != 0 {
		return errCode, nil
	}
	return message.SUCCESS, user
}

func UpdateUserInfo(params *dto.UserUpdateDTO) (responseCode int, data any) {
	userUpdateData := tools.StructToUpdateMap(params, nil, []string{"ID"})
	if err := repository.UpdateUser(params.ID, userUpdateData); err != nil {
		return message.ERROR_USER_UPDATE, nil
	}
	responseCode = message.SUCCESS
	return
}
