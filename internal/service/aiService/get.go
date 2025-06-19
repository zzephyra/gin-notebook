package aiService

import (
	"bytes"
	"context"
	"encoding/json"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"net/http"
)

func GetAIChatResponse(ctx context.Context, params *dto.AIRequestDTO) (*http.Response, error) {
	aiSettings, err := repository.GetAISettings()
	if err != nil {
		return nil, err
	}
	if params.IsSearchInternet {
		aiSettings.Model = aiSettings.Model + "?search"
	}
	payload := dto.AIHttpRequestDTO{
		Messages: params.Messages,
		Stream:   true,
		Model:    aiSettings.Model,
	}

	body, _ := json.Marshal(payload)

	upReq, _ := http.NewRequestWithContext(ctx, "POST", aiSettings.ApiUrl, bytes.NewReader(body))
	upReq.Header.Set("Authorization", "Bearer "+aiSettings.ApiKey)
	upReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Transport: &http.Transport{DisableCompression: true}}
	upRes, err := client.Do(upReq)
	if err != nil {
		return nil, err
	}
	// defer upRes.Body.Close()
	return upRes, nil
}

func GetAIHistoryChat(params *dto.AIHistoryChatParamsDTO) (responseCode int, data *dto.AIHistoryChatResponseDTO) {
	session, err := repository.GetAISessionsByID(*params)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	count, err := repository.GetAISessionCount(params.UserID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	data = &dto.AIHistoryChatResponseDTO{
		Total:    count,
		Sessions: session,
	}
	return
}

func DeleteAIHostoryChat(params *dto.AIHistoryDeleteParamsDTO) (responseCode int) {
	if err := repository.DeleteAISessionByID(params.SessionID, params.UserID); err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}

func UpdateAISessionChat(params *dto.AIHistoryUpdateParamsDTO) (responseCode int) {
	data := map[string]interface{}{}

	if params.Title != nil {
		data["title"] = *params.Title
	}

	if err := repository.UpdateAISession(database.DB, params.SessionID, params.UserID, data); err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}

func GetAISession(params *dto.AISessionParamsDTO) (responseCode int, data *dto.AISessionResponseDTO) {
	session, err := repository.GetAISessionByID(params.SessionID, params.UserID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	messages, err := repository.GetAIMessageBySessionID(params.SessionID, params.UserID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	data = &dto.AISessionResponseDTO{
		Title:    session.Title,
		Messages: messages,
	}
	return message.SUCCESS, data
}
