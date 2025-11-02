package model

type SystemSetting struct {
	BaseModel
	StorageDriver     string  `json:"storage_driver" gorm:"not null;default:'local';index:idx_storage_driver"`
	StoragePath       *string `json:"storage_path" gorm:"not null;default:'./storage';index:idx_storage_path"`
	MaximunSize       *int64  `json:"maximun_size" gorn:"not null;default:30;"`
	QiniuAK           *string `json:"qiniu_ak" gorm:"default:NULL"`
	QiniuSK           *string `json:"qiniu_sk" gorm:"default:NULL"`
	QiniuBucket       *string `json:"qiniu_bucket" gorm:"default:NULL"`
	QiniuDomain       *string `json:"qiniu_domain" gorm:"default:NULL"`
	QiniuRegion       *string `json:"qiniu_region" gorm:"default:NULL"`
	AiModel           *string `json:"ai_model" gorm:"not null;default:'deepseek-v3';index:idx_ai_model"`
	AiApiKey          *string `json:"ai_api_key" gorm:"not null;default:'';index:idx_ai_api_key"`
	AiApiUrl          *string `json:"ai_api_url" gorm:"not null;';index:idx_ai_api_url"`
	AiProvider        *string `json:"ai_provider" gorm:"not null;default:'custom';index:idx_ai_provider"`
	AIInputMaxTokens  int64   `json:"ai_input_max_tokens" gorm:"default:8000"`
	AIOutputMaxTokens int64   `json:"ai_output_max_tokens" gorm:"default:1000"`
}

type UserSetting struct {
	BaseModel
	OwnerID  int64   `json:"owner_id" gorm:"not null;index:idx_owner_id"`
	Language *string `json:"language" gorm:"not null;default:'zh-cn';index:idx_language"`
}

type ProjectSetting struct {
	BaseModel
	ProjectID      int64  `json:"project_id" gorm:"not null;index:idx_project_id"`
	CardPreview    string `json:"card_preview"  gorm:"not null;default:none"`   // null, cover
	IsPublic       bool   `json:"is_public" gorm:"not null;default:true"`       // 是否公开，所有成员可见
	IsArchived     bool   `json:"is_archived" gorm:"not null;default:false"`    // 是否归档，归档后不可操作
	EnableComments bool   `json:"enable_comments" gorm:"not null;default:true"` // 是否启用评论
}
