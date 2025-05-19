package model

type SystemSetting struct {
	BaseModel
	StorageDriver string  `json:"storage_driver" gorm:"not null;default:'local';index:idx_storage_driver"`
	StoragePath   *string `json:"storage_path" gorm:"not null;default:'./storage';index:idx_storage_path"`
	MaximunSize   *int64  `json:"maximun_size" gorn:"not null;default:30;"`
	QiniuAK       *string `json:"qiniu_ak" gorm:"default:NULL"`
	QiniuSK       *string `json:"qiniu_sk" gorm:"default:NULL"`
	QiniuBucket   *string `json:"qiniu_bucket" gorm:"default:NULL"`
	QiniuDomain   *string `json:"qiniu_domain" gorm:"default:NULL"`
	QiniuRegion   *string `json:"qiniu_region" gorm:"default:NULL"`
}

type UserSetting struct {
	BaseModel
	OwnerID  int64   `json:"owner_id" gorm:"not null;index:idx_owner_id"`
	Language *string `json:"language" gorm:"not null;default:'zh-cn';index:idx_language"`
}
