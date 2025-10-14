package dto

import "gin-notebook/internal/model"

type IntegrationAccountCreateDTO struct {
	UserID      int64  `json:"user_id" validate:"required"`
	Provider    string `json:"provider" validate:"required,oneof=notion"`
	AccountID   string `json:"account_id" validate:"required"`
	AccountName string `json:"account_name"`
	AuthType    string `json:"auth_type" validate:"required,oneof=oauth2 api_key"`
	// AccessToken 明文传输，服务端负责加密存储
	AccessToken  string  `json:"access_token" validate:"required"`
	RefreshToken *string `json:"refresh_token"`
	TokenExpiry  *int64  `json:"token_expiry"` // Unix 时间戳，秒级
	Scopes       *string `json:"scopes"`
	Extra        *string `json:"extra"` // JSON 字符串
}

type IntegrationAppCreateDTO struct {
	Provider          string  `json:"provider" validate:"required,oneof=notion feishu"`
	AppName           *string `json:"name"`
	AppID             string  `json:"app_id" validate:"required"`
	AppSecretEnc      string  `json:"app_secret" validate:"required"`
	SignSecretEnc     *string `json:"sign_secret"`
	VerificationToken *string `json:"verification_token"`
}

type IntegrationAppQueryDTO struct {
	Provider string `form:"provider" validate:"omitempty,oneof=notion feishu jira"`
}

type FeishuOAuthCallbackDTO struct {
	Code   string  `form:"code" validate:"required"`
	State  string  `form:"state" validate:"omitempty"`
	Origin *string `form:"origin" validate:"omitempty,url"`
	UserID int64   `validate:"required"`
}

type FeishuUserAccessTokenResponse struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int64  `json:"expires_in"`
	RefreshToken     string `json:"refresh_token"`
	RefreshExpiresIn int64  `json:"refresh_expires_in"`
	TokenType        string `json:"token_type"`
	Scope            string `json:"scope"`
}

type IntegrationAccountQueryDTO struct {
	Provider *model.IntegrationProvider `form:"provider" validate:"omitempty,oneof=notion feishu jira"`
	UserID   int64                      `validate:"required"`
}

type IntegrationAccountDeleteDTO struct {
	Provider model.IntegrationProvider `json:"provider" validate:"required,oneof=notion feishu jira"`
	UserID   int64                     `validate:"required"`
}
