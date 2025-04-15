package model

import (
	"gin-notebook/pkg/utils/algorithm"
	"time"

	"gorm.io/gorm"
)

type BaseModel struct {
	ID        int64           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time       `json:"created_at" gorm:"not null;autoCreateTime" time_format:"2006-01-02"`
	UpdatedAt time.Time       `json:"updated_at" gorm:"autoUpdateTime" time_format:"2006-01-02"`
	DeletedAt *gorm.DeletedAt `json:"deleted_at" time_format:"2006-01-02"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) (err error) {
	if b.ID == 0 {
		b.ID = algorithm.Snow.GenerateIDInt64()
	}
	return
}
