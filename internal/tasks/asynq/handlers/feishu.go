package handlers

import (
	"context"
	"time"

	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"

	"github.com/hibiken/asynq"
)

// 绑定到 mux.HandleFunc(types.TypeFeishuRefreshAllUserTokens, HandleFeishuRefreshAllUserTokens)
func HandleFeishuRefreshAllUserTokens(ctx context.Context, t *asynq.Task) error {
	var provider = model.ProviderFeishu

	integrationRepo := repository.NewIntegrationRepository(database.DB)

	accounts, err := integrationRepo.GetIntegrationAccountList(ctx, &provider, nil)

	var client = feishu.GetClient()

	if client == nil {
		logger.LogError(err, "Feishu integration not configured")
		return nil
	}

	if err != nil {
		return err
	}

	for _, account := range accounts {
		// 仅刷新激活的账号
		if !account.IsActive {
			continue
		}

		if account.AccessTokenExpiry != nil && time.Until(*account.AccessTokenExpiry) > 10*time.Minute {
			// AccessToken 还有超过 10 分钟有效期，无需刷新
			continue
		}

		token, err := client.RefreshUserAccessToken(ctx, *account.RefreshTokenEnc)

		if err == nil && token != nil {
			account.AccessTokenEnc = token.AccessToken
			account.RefreshTokenEnc = &token.RefreshToken

			accessTokenExpiry := time.Now().Add(time.Duration(token.ExpiresIn-300) * time.Second)
			refreshTokenExpiry := time.Now().Add(time.Duration(token.RefreshExpiresIn-300) * time.Second)
			account.AccessTokenExpiry = &accessTokenExpiry
			account.RefreshTokenExpiry = &refreshTokenExpiry

			err := integrationRepo.BindIntegrationAccount(ctx, &account)
			if err != nil {
				logger.LogError(err, "Failed to update Feishu account token for user", map[string]interface{}{
					"user_id": account.UserID,
				})
			}

		}
	}

	feishu.GetClient()
	return nil
}
