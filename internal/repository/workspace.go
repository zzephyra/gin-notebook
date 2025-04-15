package repository

import (
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"

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

func CreateWorkspace(db *gorm.DB, workspace *model.Workspace) error {
	result := db.Create(workspace)
	return result.Error
}

func CreateWorkspaceInviteLink(db *gorm.DB, inviteLink *model.WorkspaceInvite) error {
	result := db.Create(inviteLink)
	return result.Error
}

func GetWorkspaceByID(workspaceID any, OwnerID int64) (*dto.WorkspaceListDTO, error) {
	var workspace dto.WorkspaceListDTO
	err := database.DB.Table("workspaces").Select("workspaces.*, users.email AS owner_email").Joins("left join users ON users.id = workspaces.owner").Where("workspaces.id = ? and owner = ?", workspaceID, OwnerID).First(&workspace).Error
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}
