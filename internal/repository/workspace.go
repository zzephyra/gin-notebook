package repository

import (
	"encoding/json"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/logger"

	"gorm.io/gorm"
)

func GetWorkspaceListByUserID(UserID int64, start int, limit int) (*[]dto.WorkspaceListDTO, error) {
	var workspace []dto.WorkspaceListDTO
	err := database.DB.Table("workspaces").Select("workspaces.*, users.email AS owner_email").Joins("left join users ON users.id = workspaces.owner").Where("owner = ?", UserID).Offset(start).Limit(limit).Scan(&workspace).Error
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

func GetWorkspacePrivileges(workspaceID any, userID int64, fields string) (*[]model.WorkspaceMember, error) {
	if fields == "" {
		fields = "workspace_members.*"
	}

	var workspacePrivileges []model.WorkspaceMember
	err := database.DB.Table("workspace_members").Select(fields).Where("workspace_id = ? and user_id = ?", workspaceID, userID).Find(&workspacePrivileges).Error
	if err != nil {
		return nil, err
	}
	return &workspacePrivileges, nil
}

func CreateWorkspace(db *gorm.DB, workspace *model.Workspace) error {
	result := db.Create(workspace)
	return result.Error
}

func CreateWorkspaceInviteLink(db *gorm.DB, inviteLink *model.WorkspaceInvite) error {
	result := db.Create(inviteLink)
	return result.Error
}

func GetWorkspaceByID(workspaceID any, OwnerID int64) (*dto.WorkspaceDTO, error) {
	var workspace dto.WorkspaceDTO
	err := database.DB.Table("workspaces").Select("workspaces.*, users.email AS owner_email, wm.role as roles, wm.nickname as nickname, wm.editable as editable").Joins("left join users ON users.id = workspaces.owner").Joins("left join workspace_members as wm on wm.workspace_id = workspaces.id and wm.user_id = ?", OwnerID).Where("workspaces.id = ? and owner = ?", workspaceID, OwnerID).First(&workspace).Error
	if err != nil {
		return nil, err
	}
	roles := make([]string, 0)
	if err = json.Unmarshal([]byte(workspace.Roles), &roles); err != nil {
		logger.LogError(err, "获取工作区信息失败:")
	}

	fmt.Println("获取工作区信息:", roles)
	return &workspace, nil
}
