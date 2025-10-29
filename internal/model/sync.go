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

type SyncOutbox struct {
	ID          int64          `gorm:"primaryKey;autoIncrement;column:id"`
	LinkID      int64          `gorm:"type:bigint;not null;index"`
	NoteID      int64          `gorm:"type:bigint;not null;index"`
	NoteVersion int64          `gorm:"type:bigint;not null"`
	OpType      string         `gorm:"type:varchar(32);not null"`
	PatchJSON   datatypes.JSON `gorm:"type:jsonb;not null"`
	Status      SyncStatus     `gorm:"type:varchar(16);not null;default:'pending'"`
	CreatedAt   time.Time      `gorm:"type:timestamptz;not null;default:now()"`
	UpdatedAt   time.Time      `json:"updated_at" gorm:"autoUpdateTime" time_format:"2006-01-02"`
	LastError   *string        `gorm:"type:text"`
}

func (SyncOutbox) TableName() string {
	return "sync_outbox"
}
