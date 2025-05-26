package workspace

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"time"
)

func GetWorkspaceInviteLink(params *dto.GetWorkspaceInviteLinkDTO) (responseCode int, data *dto.WorkspaceInviteLinkDTO) {
	// 1. 获取工作空间邀请链接
	link, err := repository.GetWorkspaceInviteLinkByID(params.LinkUUID)
	if err != nil {
		responseCode = message.ERROR_WORKSPACE_INVITE_LINK_NOT_EXIST
		return
	}

	if link.ExpiresAt != nil && link.ExpiresAt.Before(time.Now()) {
		responseCode = message.ERROR_WORKSPACE_INVITE_LINK_EXPIRED
		return
	}

	if !link.AllowJoin {
		responseCode = message.ERROR_WORKSPACE_INVITE_LINK_NOT_ALLOW_JOIN
		return
	}

	_, err = repository.GetWorkspaceMember(params.UserID, link.WorkspaceID)
	if err == nil {
		responseCode = message.ERROR_WORKSPACE_MEMBER_EXIST
		return
	}
	data = link
	responseCode = message.SUCCESS
	return
}
