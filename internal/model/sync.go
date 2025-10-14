package model

import (
	"time"

	"gorm.io/datatypes"
)

type OutboxEvent struct {
	ID          int64          `gorm:"primaryKey"`
	Topic       string         `gorm:"type:varchar(64); not null; index"`
	Key         string         `gorm:"type:varchar(255); index"`
	Payload     datatypes.JSON `gorm:"type:jsonb; not null"`
	RetryCount  int            `gorm:"not null; default:0"`
	AvailableAt time.Time      `gorm:"not null; index"`
	CreatedAt   time.Time      `gorm:"not null"`
}
