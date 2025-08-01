package repository

import "gorm.io/gorm"

func CreateModel[T any](db *gorm.DB, model *T) error {
	result := db.Create(model)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func BulkCreateModel[T any](db *gorm.DB, models *[]T) error {
	result := db.Create(models)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
