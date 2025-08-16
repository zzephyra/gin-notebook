package repository

import "gorm.io/gorm"

func CreateModel[T any](db *gorm.DB, model T) error {
	result := db.Create(model)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteModel[T any](db *gorm.DB, model T) error {
	result := db.Delete(model)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
