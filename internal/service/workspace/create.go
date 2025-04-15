package workspace

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"strconv"
	"time"

	"gorm.io/gorm"
)

type CreateWorkspaceParams struct {
	Name        string `json:"name" binding:"required"`
	Owner       int64  `json:"owner" binding:"required"`
	UUID        string `json:"uuid"`
	Emails      string `json:"emails"`
	Expire      string `json:"expire"`
	Description string `json:"desciption"`
}

func CreateWorkspace(workspace *dto.WorkspaceValidation) (responseCode int, data any) {
	_ = database.DB.Transaction(func(tx *gorm.DB) (err error) {

		workspaceModel := &model.Workspace{
			Name:        workspace.Name,
			Owner:       workspace.Owner,
			Description: workspace.Description,
		}

		err = repository.CreateWorkspace(tx, workspaceModel)
		if err != nil {
			responseCode = message.ERROR_DATABASE
			return err
		}

		workspaceMember := &model.WorkspaceMember{
			WorkspaceID: workspaceModel.ID,
			UserID:      workspace.Owner,
			Role:        model.MemberRole.Admin,
		}
		err = repository.CreateMember(workspaceMember)
		if err != nil {
			responseCode = message.ERROR_DATABASE
			return err
		}
		logger.LogInfo("workspace UUID: ", map[string]interface{}{})
		// 创建邀请链接
		if workspace.UUID != "" {
			_, exist := tools.Find([]string{"", "1", "7", "14", "30"}, workspace.Expire)
			var expireDate *time.Time = nil
			if exist {
				if workspace.Expire != "" {
					days, err := strconv.Atoi(workspace.Expire)
					if err == nil {
						t := time.Now().AddDate(0, 0, days)
						expireDate = &t
					} else {
						t := time.Now().AddDate(0, 0, 7)
						expireDate = &t
					}
				}
			} else {
				t := time.Now().AddDate(0, 0, 7)
				expireDate = &t
			}

			invite := &model.WorkspaceInvite{
				WorkspaceID: workspaceModel.ID,
				UUID:        workspace.UUID,
				Count:       0,
				ExpiresAt:   *expireDate,
			}
			err = repository.CreateWorkspaceInviteLink(tx, invite)
			if err == nil {
				return err
			}
		}

		responseCode = message.SUCCESS
		// 返回workspace ID，前端需要这个ID来跳转
		data = workspaceModel.ID
		return nil
	})

	return
}

func GetWorkspace(workspaceID string, OwnerID int64) (responseCode int, data any) {
	workspaces, err := repository.GetWorkspaceByID(workspaceID, OwnerID)
	if err != nil {
		responseCode = message.ERROR_DATABASE
		return responseCode, nil
	}

	responseCode = message.SUCCESS
	data = workspaces

	return responseCode, data
}
