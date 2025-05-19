package repository

import (
	"errors"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/utils/tools"

	"gorm.io/gorm"
)

func UpdateSystemSettings(id int64, data *dto.UpdateSystemSettingsDTO) error {
	updateData := tools.StructToUpdateMap(data, nil, []string{"ID"})
	err := database.DB.Model(&model.SystemSetting{}).Where("id = ?", id).Updates(updateData).Error
	return err
}

func CreateSystemSettingsIfNotExists() (data *model.SystemSetting, err error) {
	settings := &model.SystemSetting{}

	result := database.DB.First(settings)
	if result.RowsAffected > 0 {
		data = settings
		return
	}

	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		err = result.Error
		return
	}
	StoragePath := "storage"
	settings.StoragePath = &StoragePath
	err = database.DB.Create(settings).Error
	data = settings
	return
}

func GetSystemSettings() (data *model.SystemSetting, err error) {
	settings := &model.SystemSetting{}
	result := database.DB.First(settings)
	if result.RowsAffected > 0 {
		data = settings
		return
	}

	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		err = result.Error
		return
	}
	data = settings
	return
}
