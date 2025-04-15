package workspace

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/repository"
)

func GetWorkspaceList(userID int64) (int, any) {
	workspaces, error := repository.GetWorkspaceListByUserID(userID, 0, 10)
	if error != nil {
		return message.ERROR_DATABASE, nil
	}
	return message.SUCCESS, workspaces
}
