package integrationService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"

	"github.com/jinzhu/copier"
)

func CreateIntegrationApp(ctx context.Context, params *dto.IntegrationAppCreateDTO) (responseCode int, data interface{}) {
	var app model.IntegrationApp
	copier.Copy(&app, params)
	if params.Provider == "feishu" {
		err := feishu.VerifyAppCredentials(params.AppID, params.AppSecretEnc)
		if err != nil {
			responseCode = message.ERROR_INVALID_INTEGRATION_APP_CREDENTIALS
			return responseCode, nil
		}
	}

	integrationRep := repository.NewIntegrationRepository(database.DB)

	err := integrationRep.CreateIntegrationApp(ctx, &app)
	if err != nil {
		responseCode = database.IsError(err)
		return responseCode, nil
	}

	data = app.Data()
	responseCode = message.SUCCESS
	return
}

func GetIntegrationAppList(ctx context.Context, params *dto.IntegrationAppQueryDTO) (responseCode int, data map[string]interface{}) {
	integrationRep := repository.NewIntegrationRepository(database.DB)

	apps, err := integrationRep.GetIntegrationAppList(ctx, params.Provider)

	if err != nil {
		responseCode = database.IsError(err)
		return responseCode, nil
	}
	parsedData := make([]map[string]interface{}, 0, len(apps))

	for _, app := range apps {
		parsedData = append(parsedData, app.Data())
	}

	data = map[string]interface{}{
		"apps": parsedData,
	}
	responseCode = message.SUCCESS
	return
}

func GetIntegrationAccountList(ctx context.Context, params *dto.IntegrationAccountQueryDTO) (responseCode int, data map[string]interface{}) {

	integrationRep := repository.NewIntegrationRepository(database.DB)

	accounts, err := integrationRep.GetIntegrationAccountList(ctx, params.Provider, &params.UserID)

	if err != nil {
		responseCode = database.IsError(err)
		return responseCode, nil
	}
	parsedData := make([]map[string]interface{}, 0, len(accounts))

	for _, account := range accounts {
		parsedData = append(parsedData, account.Data())
	}

	data = map[string]interface{}{
		"accounts": parsedData,
	}
	responseCode = message.SUCCESS
	return
}

func UnlinkIntegrationAccount(ctx context.Context, params *dto.IntegrationAccountDeleteDTO) (responseCode int) {
	integrationRep := repository.NewIntegrationRepository(database.DB)

	err := integrationRep.UnlinkIntegrationAccount(ctx, params.UserID, params.Provider)

	if err != nil {
		responseCode = database.IsError(err)
		return responseCode
	}

	responseCode = message.SUCCESS
	return
}
