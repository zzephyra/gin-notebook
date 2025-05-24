package workspace

import (
	"encoding/json"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
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

		workspaceRole, _ := json.Marshal([]string{model.MemberRole.Admin})

		workspaceMember := &model.WorkspaceMember{
			WorkspaceID: workspaceModel.ID,
			UserID:      workspace.Owner,
			Role:        datatypes.JSON(workspaceRole),
		}
		err = repository.CreateMember(workspaceMember)
		if err != nil {
			responseCode = message.ERROR_DATABASE
			return err
		}

		// 创建默认的笔记分类
		noteCategory := &model.NoteCategory{
			WorkspaceID:  workspaceModel.ID,
			CategoryName: "default",
			OwnerID:      workspace.Owner,
		}

		_, err = repository.CreateNoteCategory(noteCategory)
		if err != nil {
			responseCode = message.ERROR_WORKSPACE_NOTE_CATEGORY_CREATE
			return
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
				ExpiresAt:   expireDate,
			}
			err = repository.CreateWorkspaceInviteLink(tx, invite)
			if err != nil {
				// 发送邀请邮件失败
				responseCode = message.ERROR_WORKSPACE_INVITE_EMAIL
				return
			}
		}

		responseCode = message.SUCCESS
		// 返回workspace ID，前端需要这个ID来跳转
		data = strconv.FormatInt(workspaceModel.ID, 10)
		return nil
	})

	return
}

func GetWorkspace(workspaceID string, UserID int64) (responseCode int, data any) {
	workspaces, err := repository.GetWorkspaceByID(workspaceID, UserID)
	if err != nil {
		responseCode = message.ERROR_DATABASE
		return responseCode, nil
	}

	responseCode = message.SUCCESS
	data = workspaces

	return responseCode, data
}

func CreateWorkspaceLinks(params *dto.CreateWorkspaceInviteLinkDTO) (responseCode int, data *model.WorkspaceInvite) {
	isAllowed := repository.IsUserAllowedToModifyWorkspace(params.UserID, params.WorkspaceID)
	if !isAllowed {
		responseCode = message.ERROR_NO_PERMISSION_TO_UPDATE_WORKSPACE
		return
	}
	_, exist := tools.Find([]string{"", "1", "7", "14", "30"}, params.ExipiresAt)
	var expireDate *time.Time = nil
	if exist {
		if params.ExipiresAt != "" {
			days, err := strconv.Atoi(params.ExipiresAt)
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
		WorkspaceID: params.WorkspaceID,
		UUID:        strings.ReplaceAll(uuid.New().String(), "-", ""),
		Count:       0,
		ExpiresAt:   expireDate,
	}
	err := repository.CreateWorkspaceInviteLink(nil, invite)
	if err != nil {
		// 发送邀请邮件失败
		responseCode = message.ERROR_WORKSPACE_INVITE_EMAIL
		return
	}
	responseCode = message.SUCCESS
	data = invite
	return
}
