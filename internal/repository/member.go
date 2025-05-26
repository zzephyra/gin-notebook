package repository

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
)

func CreateMember(member *model.WorkspaceMember) error {
	result := database.DB.Create(member)
	if err := result.Error; err != nil {
		return err
	}
	return nil
}

func CreateWorkspaceMember(member *model.WorkspaceMember) error {
	result := database.DB.Model(&model.WorkspaceMember{}).Where("workspace_id = ? AND user_id = ?", member.WorkspaceID, member.UserID).FirstOrCreate(member)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("工作区成员已存在")
	}
	return nil
}
