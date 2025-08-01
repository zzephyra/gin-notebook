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
	// Check if the user is allowed to modify the workspace
	isAdmin := repository.IsUserAllowedToModifyWorkspace(params.UserID, params.WorkspaceID)
	if !isAdmin {
		return message.ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE, nil
	}

	// Delete the workspace link
	err := repository.DeleteWorkspaceInviteLink(params.LinkID)
	if err != nil {
		return database.IsError(err), nil
	}

	return message.SUCCESS, nil
}

func GetWorkspaceMembers(params *dto.GetWorkspaceMembersDTO) (responseCode int, data map[string]interface{}) {
	isAllowed := repository.IsUserAllowedToModifyWorkspace(params.UserID, params.WorkspaceID)

	if !isAllowed {
		responseCode = message.ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE
		return
	}

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
