package repository

import (
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
