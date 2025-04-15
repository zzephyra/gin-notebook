package repository

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/pkg/utils/algorithm"

	"gorm.io/gorm"
)

func CreateUser(data dto.CreateUserValidation) error {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		user := &model.User{
			Email:    data.Email,
			Password: string(algorithm.HashPassword(data.Password)),
		}
		rbac.SetUserRole(user.ID, rbac.USER)
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return err
	}

	return nil
}

func GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	if err := database.DB.Where("email = ?", email).First(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByID(id int64) (*model.User, int) {
	user := &model.User{}
	if err := database.DB.Where("id = ?", id).First(user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, message.ERROR_USER_NOT_EXIST
		} else {
			return nil, message.ERROR_DATABASE
		}
	}
	return user, 0
}
