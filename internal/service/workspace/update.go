package workspace

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/tools"
)

func UpdateWorkspace(params *dto.UpdateWorkspaceDTO) (responseCode int, data any) {
	isAllowed := repository.IsUserAllowedToModifyWorkspace(params.Owner, params.WorkspaceID)
	if !isAllowed {
		responseCode = message.ERROR_NO_PERMISSION_TO_UPDATE_WORKSPACE
		return
	}

	err := repository.UpdateWorkspace(params.WorkspaceID, tools.StructToUpdateMap(params, nil, []string{"WorkspaceID", "Owner"}))
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	// 2. 返回数据
	responseCode = message.SUCCESS
	return
}
