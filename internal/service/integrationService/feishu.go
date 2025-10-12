package integrationService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"time"
)

func HandleFeishuOAuthCallback(ctx context.Context, params *dto.FeishuOAuthCallbackDTO) (responseCode int, data interface{}) {
	// state 里携带了 appID 和 redirectURL
	c := feishu.GetClient()

	if c.Client == nil {
		return message.ERROR_FEISHU_INTEGRATION_NOT_CONFIGURED, nil
	}

	user_access_token, err := c.GetUserAccessToken(ctx, params.Code)
	if err != nil {
		return message.ERROR_FEISHU_GET_USER_ACCESS_TOKEN_FAILED, nil
	}

	repo := repository.NewIntegrationRepository(database.DB)

	accessTokenExpiry := time.Now().Add(time.Duration(user_access_token.ExpiresIn-300) * time.Second)
	refreshTokenExpiry := time.Now().Add(time.Duration(user_access_token.RefreshExpiresIn-300) * time.Second)

	repo.BindIntegrationAccount(ctx, &model.IntegrationAccount{
		UserID:             params.UserID,
		Provider:           "feishu",
		AccessTokenEnc:     user_access_token.AccessToken,
		RefreshTokenEnc:    &user_access_token.RefreshToken,
		AccessTokenExpiry:  &accessTokenExpiry,
		RefreshTokenExpiry: &refreshTokenExpiry,
		Scopes:             &user_access_token.Scope,
		Extra:              nil,
		IsActive:           true,
	})
	return message.SUCCESS, nil
}
