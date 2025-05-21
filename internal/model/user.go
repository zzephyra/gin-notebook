package model

import (
	"gorm.io/datatypes"
)

type User struct {
	BaseModel
	Nickname *string `json:"nickname" gorm:";default:NULL"`
	Password string  `json:"password" gorm:"not null"`
	Email    string  `json:"email" gorm:"unique;not null"`
	Phone    string  `json:"phone" gorm:"unique;default:NULL"`
	Avatar   string  `json:"avatar" gorm:"default:NULL"`
}

type UserDevice struct {
	BaseModel
	UserID      int64          `json:"user_id" gorm:"not null;index:idx_user_id"`
	Fingerprint string         `json:"fingerprint" gorm:"not null;unique;index:idx_fingerprint_user_id"`
	DeviceName  string         `json:"device_name" gorm:"not null"`
	Os          string         `json:"os" gorm:"not null"`
	Device      string         `json:"device" gorm:"not null;default:desktop"`
	UserAgent   string         `json:"ua" gorm:"not null"`
	IP          string         `json:"ip" gorm:"not null;index:idx_ip_user_id"`
	Country     datatypes.JSON `json:"country" gorm:"not null"`
	City        datatypes.JSON `json:"city" gorm:"not null"`
}
