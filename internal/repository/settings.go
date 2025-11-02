package repository

import (
	"errors"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/utils/tools"
	"time"

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

func GetAISettings() (data *dto.AISettingsDTO, err error) {
	// 增加缓存检测

	cachedSettings, err := cache.RedisInstance.GetCachedSystemSettings()
	if err == nil {
		inputMaxTokens, ok := tools.ToInt64(cachedSettings["ai_input_max_tokens"])
		if !ok {
			inputMaxTokens = 8000
		}

		outMaxTokens, ok := tools.ToInt64(cachedSettings["ai_output_max_tokens"])
		if !ok {
			outMaxTokens = 4000
		}

		return &dto.AISettingsDTO{
			Model:             cachedSettings["ai_model"],
			ApiKey:            cachedSettings["ai_api_key"],
			ApiUrl:            cachedSettings["ai_api_url"],
			AiProvider:        cachedSettings["ai_provider"],
			AIInputMaxTokens:  inputMaxTokens,
			AIOutputMaxTokens: outMaxTokens,
		}, nil
	}

	settings := &dto.AISettingsDTO{}

	result := database.DB.Select("ai_model", "ai_api_key", "ai_api_url", "ai_provider", "ai_input_max_tokens", "ai_output_max_tokens").First(settings)
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

func UpdateProjectSettingByID(db *gorm.DB, ProjectID int64, updatedAt time.Time, data map[string]interface{}) (settings *model.ProjectSetting, err error, conflicted bool) {
	sql := db.Model(&model.ProjectSetting{}).Where("project_id = ? AND updated_at = ?", ProjectID, updatedAt).Updates(data)

	if sql.Error != nil {
		return nil, sql.Error, false
	}

	if sql.RowsAffected == 0 {
		conflicted = true
	}
	var c model.ProjectSetting
	err = db.Where("project_id = ?", ProjectID).First(&c).Error
	if err != nil {
		return
	}

	settings = &c
	return
}

func UpdateProjectByID(db *gorm.DB, ProjectID int64, updatedAt time.Time, data map[string]interface{}) (settings *model.Project, err error, conflicted bool) {
	sql := db.Model(&model.Project{}).Where("id = ? AND updated_at = ?", ProjectID, updatedAt).Updates(data)

	if sql.Error != nil {
		return nil, sql.Error, false
	}

	if sql.RowsAffected == 0 {
		conflicted = true
	}
	var c model.Project
	err = db.Where("id = ?", ProjectID).First(&c).Error
	if err != nil {
		return
	}

	settings = &c
	return
}
