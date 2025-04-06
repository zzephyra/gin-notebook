package user

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/repository"
)

func GetUserInfo(userID string) (responseCode int, data any) {
	user, errCode := repository.GetUserByID(userID)
	if errCode != 0 {
		return errCode, nil
	}
	return message.SUCCESS, user
}
