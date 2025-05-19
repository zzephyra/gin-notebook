package qiniu

import (
	"github.com/qiniu/go-sdk/v7/storagev2/http_client"
	"github.com/qiniu/go-sdk/v7/storagev2/region"
	"github.com/qiniu/go-sdk/v7/storagev2/uploader"
)

const (
	RegionID = "z2" // 机房区域
)

func NewUploadManager() *uploader.UploadManager {
	options := uploader.UploadManagerOptions{
		Options: http_client.Options{
			Regions: region.GetRegionByID(RegionID, true),
		},
	}
	return uploader.NewUploadManager(&options)
}
