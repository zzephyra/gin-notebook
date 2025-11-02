package dto

type UpdateSystemSettingsDTO struct {
	StorageDriver *string `json:"storage_driver" validate:"omitempty,oneof=local qiniu"`
	StoragePath   *string `json:"storage_path" validate:"omitempty,dir"`
	MaximunSize   *int64  `json:"maximun_size" validate:"omitempty,min=1,max=200"`
	QiniuAK       *string `json:"qiniu_ak" validate:"required_if=StorageDriver qiniu,omitempty,min=3"`        // qiniu 时必填
	QiniuSK       *string `json:"qiniu_sk" validate:"required_if=StorageDriver qiniu,omitempty,min=3"`        // qiniu 时必填
	QiniuBucket   *string `json:"qiniu_bucket" validate:"required_if=StorageDriver qiniu,omitempty,min=1"`    // qiniu 时必填
	QiniuDomain   *string `json:"qiniu_domain" validate:"required_if=StorageDriver qiniu,omitempty,hostname"` // qiniu 时必填
	QiniuRegion   *string `json:"qiniu_region" validate:"required_if=StorageDriver qiniu,omitempty,min=1"`    // qiniu 时必填

	AiModel           *string `json:"ai_model" validate:"omitempty,min=1,max=100,required_if=AiProvider custom"`
	AiApiKey          *string `json:"ai_api_key" validate:"omitempty,min=1,max=256"`
	AiApiUrl          *string `json:"ai_api_url" validate:"omitempty,url"`
	AiProvider        *string `json:"ai_provider" validate:"omitempty,oneof=openai azure custom deepseek"`
	AIInputMaxTokens  *int64  `json:"ai_input_max_tokens" validate:"omitempty,gte=4000,lte=200000"`
	AIOutputMaxTokens *int64  `json:"ai_output_max_tokens" validate:"omitempty,gte=4000,lte=16000"`
}

type GetSettingsDTO struct {
	Roles    []string  `form:"roles" validate:"required,dive,oneof=admin user"`
	Filter   *[]string `form:"filter" validate:"omitempty"`
	Category string    `form:"category" validate:"omitempty,oneof=all system user"`
}
