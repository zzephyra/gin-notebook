package workspace

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
)

func GetWorkspaceList(userID int64) (int, any) {
	workspaces, err := repository.GetWorkspaceListByUserID(userID, 0, 10)
	if err != nil {
		return database.IsError(err), nil
	}
	return message.SUCCESS, workspaces
}

func GetWorkspaceLinks(params *dto.WorkspaceLinksDTO) (int, any) {
	links, err := repository.GetWorkspaceLinks(params.WorkspaceID)
	if err != nil {
		return database.IsError(err), nil
	}
	return message.SUCCESS, links
}

func DeleteWorkspaceLinks(params *dto.DeleteWorkspaceInviteLinkDTO) (int, any) {
	// Delete the workspace link
	err := repository.DeleteWorkspaceInviteLink(params.LinkID)
	if err != nil {
		return database.IsError(err), nil
	}

	return message.SUCCESS, nil
}

func GetWorkspaceMembers(params *dto.GetWorkspaceMembersDTO) (responseCode int, data map[string]interface{}) {
	members, total, err := repository.GetWorkspaceMembers(params.WorkspaceID, params.Limit, params.Offset, params.Keywords)

	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	data = map[string]interface{}{
		"data":  members,
		"total": total,
	}
	return
}
