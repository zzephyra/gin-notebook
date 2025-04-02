package repository

import (
	"gin-notebook/internal/model"

	"gorm.io/gorm"
)

type UserRepository struct {
	model model.User
	db    *gorm.DB
}

func (r *UserRepository) CreateUser(user *model.User) (model.User, error) {
	if err := r.db.Create(user).Error; err != nil {
		return r.model, err
	}
	return *user, nil

}

func (r *UserRepository) GetUserByID(id uint) (model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return r.model, err
	}
	return user, nil
}

func (r *UserRepository) UpdateUser(user *model.User) (model.User, error) {
	if err := r.db.Save(user).Error; err != nil {
		return r.model, err
	}
	return *user, nil
}

func (r *UserRepository) DeleteUser(id uint) error {
	if err := r.db.Delete(&model.User{}, id).Error; err != nil {
		return err
	}
	return nil
}

func (r *UserRepository) GetAllUsers() ([]model.User, error) {
	var users []model.User
	if err := r.db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
