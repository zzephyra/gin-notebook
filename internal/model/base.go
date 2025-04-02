package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time  `json:"created_at" gorm:"not null;autoCreateTime"`
	UpdatedAt time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt *time.Time `json:"deleted_at"`
}

type BaseModelWithUUID struct {
	BaseModel
	UUID string `json:"uuid" gorm:"type:uuid;"`
}

func (b *BaseModelWithUUID) BeforeCreate(tx *gorm.DB) (err error) {
	if b.UUID == "" {
		b.UUID = uuid.New().String()
	}
	return nil
}
