package startup

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/thirdparty/qiniu"
	"gin-notebook/pkg/utils/tools"
)

func Init() (err error) {
	// 初始化函数
	// 1. 缓存系统设置
	data, err := repository.CreateSystemSettingsIfNotExists()
	if err != nil {
		return
	}
	if data.StorageDriver == "qiniu" {
		// 2. 初始化七牛云存储
		err = InitQiniuCloud(data)
		if err != nil {
			return
		}
	}
	systemSetting := tools.StructToUpdateMap(data, nil, []string{})
	err = cache.RedisInstance.SaveSystemSettings(systemSetting)

	return
}

func InitQiniuCloud(data *model.SystemSetting) (err error) {
	// 初始化七牛云设置
	AccessKey := data.QiniuAK
	SecretKey := data.QiniuSK
	Bucket := data.QiniuBucket
	if AccessKey != nil && SecretKey != nil && Bucket != nil {
		cfg := qiniu.QiniuConfig{
			AccessKey: *AccessKey,
			SecretKey: *SecretKey,
			Bucket:    *Bucket,
			Domain:    "swbz2tsc2.hn-bkt.clouddn.com",
			RegionID:  "z0",
			TTL:       3600,
		}
		qiniu.NewQiniu(cfg)
		fmt.Println("七牛云存储初始化成功")
		return nil
	} else {
		return fmt.Errorf("qiniu cloud settings are not complete")
	}
}
