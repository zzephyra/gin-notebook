package aiService

import (
	"bytes"
	"context"
	"encoding/json"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"net/http"
)

func GetAIChatResponse(ctx context.Context, params *dto.AIRequestDTO) (*http.Response, error) {
	// 1. 后端决定模型
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
