package dto

type AIRequestDTO struct {
	Messages []map[string]any `json:"messages"`
}

type AIHttpRequestDTO struct {
	Messages []map[string]any `json:"messages"`
	Stream   bool             `json:"stream"`
	Model    string           `json:"model"`
}

type AISettingsDTO struct {
	Model  string `json:"ai_model"`
	ApiKey string `json:"ai_api_key"`
	ApiUrl string `json:"ai_api_url"`
}
