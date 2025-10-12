package model

import (
	"time"

	"gorm.io/datatypes"
)

type IntegrationAccount struct {
	ID       int64               `gorm:"primaryKey"`
	UserID   int64               `gorm:"not null;uniqueIndex:idx_user_provider"`
	Provider IntegrationProvider `gorm:"type:varchar(32); not null;uniqueIndex:idx_user_provider"`

	AccountID   *string `gorm:"type:varchar(255); index:idx_user_provider_account,priority:2"`
	AccountName *string `gorm:"type:varchar(255)"`

	AuthType IntegrationAuthType `gorm:"type:varchar(16); not null; default:'oauth2'"`

	AccessTokenEnc     string         `gorm:"type:text; not null"`
	RefreshTokenEnc    *string        `gorm:"type:text"`
	AccessTokenExpiry  *time.Time     `gorm:"index"`     // OAuth2 过期时间
	RefreshTokenExpiry *time.Time     `gorm:"index"`     // Refresh Token 过期时间
	Scopes             *string        `gorm:"type:text"` // 原始 scope 串
	Extra              datatypes.JSON `gorm:"type:json"` // 任意附加信息（如安装信息、bot_id等）

	// 状态管理
	IsActive  bool       `gorm:"not null; default:true; index"`
	RevokedAt *time.Time `gorm:"index"`

	BaseModel
}

func (i *IntegrationAccount) Data() map[string]interface{} {
	return map[string]interface{}{
		"id":           i.ID,
		"user_id":      i.UserID,
		"provider":     i.Provider,
		"account_id":   i.AccountID,
		"account_name": i.AccountName,
		"auth_type":    i.AuthType,
		"is_active":    i.IsActive,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}
}

type IntegrationApp struct {
	ID       int64   `gorm:"primaryKey"`
	Provider string  `gorm:"type:varchar(32); not null; uniqueIndex:uidx_provider"`
	Env      string  `gorm:"type:varchar(16); not null; default:'prod'"`
	AppName  *string `gorm:"type:varchar(255)"`

	AppID                string  `gorm:"type:varchar(255); not null"`
	AppSecretEnc         string  `gorm:"type:text; not null"`
	SignSecretEnc        *string `gorm:"type:text"`
	VerificationTokenEnc *string `gorm:"type:text"`

	KID           *string `gorm:"type:varchar(64)"`
	LastRotatedAt *time.Time
	IsActive      bool `gorm:"not null; default:true"`

	BaseModel
}

func (i *IntegrationApp) Data() map[string]interface{} {
	return map[string]interface{}{
		"id":         i.ID,
		"provider":   i.Provider,
		"env":        i.Env,
		"app_name":   i.AppName,
		"app_id":     i.AppID,
		"is_active":  i.IsActive,
		"created_at": i.CreatedAt,
		"updated_at": i.UpdatedAt,
	}
}
