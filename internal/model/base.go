package model

import (
	"gin-notebook/pkg/utils/algorithm"
	"time"
)

type BaseModel struct {
	ID        int64      `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;autoCreateTime" time_format:"2006-01-02"`
	UpdatedAt time.Time  `json:"updated_at" gorm:"autoUpdateTime" time_format:"2006-01-02"`
	DeletedAt *time.Time `json:"deleted_at" time_format:"2006-01-02"`
}

func (b *BaseModel) GenerateID() (err error) {
	b.ID = algorithm.Snow.GenerateIDInt64()
	return nil
}
