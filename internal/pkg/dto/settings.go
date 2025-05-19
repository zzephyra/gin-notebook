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
}

type GetSettingsDTO struct {
	Roles    []string  `form:"roles" validate:"required,dive,oneof=admin user"`
	Filter   *[]string `form:"filter" validate:"omitempty"`
	Category string    `form:"category" validate:"omitempty,oneof=all system user"`
}
