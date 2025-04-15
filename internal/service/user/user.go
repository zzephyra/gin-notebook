package user

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/repository"
)

func GetUserInfo(UserID int64) (responseCode int, data any) {
	user, errCode := repository.GetUserByID(UserID)
	if errCode != 0 {
		return errCode, nil
	}
	return message.SUCCESS, user
}
