package qiniu

import (
	"context"
	"sync/atomic"
	"time"

	"github.com/qiniu/go-sdk/v7/storagev2/credentials"
	"github.com/qiniu/go-sdk/v7/storagev2/http_client"
	"github.com/qiniu/go-sdk/v7/storagev2/region"
	"github.com/qiniu/go-sdk/v7/storagev2/uploader"
	"github.com/qiniu/go-sdk/v7/storagev2/uptoken"
)

type QiniuConfig struct {
	AccessKey string
	SecretKey string
	Bucket    string
	Domain    string        // CDN / 自定义域名
	RegionID  string        // z0 / z1 / z2 / …，留空则自动探测
	TTL       time.Duration // 上传凭证有效期
}

type QiniuService struct {
	cfg      QiniuConfig
	mac      *credentials.Credentials
	uploader *uploader.UploadManager
}

var qiniuInstance atomic.Pointer[QiniuService]

func GetQiniuService() *QiniuService {
	return qiniuInstance.Load()
}

func NewQiniu(cfg QiniuConfig) {
	mac := credentials.NewCredentials(cfg.AccessKey, cfg.SecretKey)
	up := uploader.NewUploadManager(&uploader.UploadManagerOptions{
		Options: http_client.Options{
			Credentials: mac,
			Regions:     region.GetRegionByID(cfg.RegionID, true),
		},
	})
	qiniuInstance.Store(&QiniuService{cfg: cfg, mac: mac, uploader: up})
}

// 1) 生成客户端直传用的 UploadToken
func (q *QiniuService) UploadToken() (string, error) {
	pp, err := uptoken.NewPutPolicy(q.cfg.Bucket, time.Now().Add(q.cfg.TTL))
	if err != nil {
		return "", err
	}
	return uptoken.NewSigner(pp, q.mac).GetUpToken(context.Background())
}

// 2) 服务端直传（multipart 表单上传）
func (q *QiniuService) UploadFile(ctx context.Context, key string, localPath string) error {
	return q.uploader.UploadFile(context.Background(), localPath, &uploader.ObjectOptions{
		BucketName: q.cfg.Bucket,
		ObjectName: &key,
		CustomVars: map[string]string{
			"name": "github logo",
		},
	}, nil)
}

func (q *QiniuService) Reload() {
	q.mac = credentials.NewCredentials(q.cfg.AccessKey, q.cfg.SecretKey)
	q.uploader = uploader.NewUploadManager(&uploader.UploadManagerOptions{
		Options: http_client.Options{
			Credentials: q.mac,
			Regions:     region.GetRegionByID(q.cfg.RegionID, true),
		},
	})
}

func (q *QiniuService) ResetConfig(cfg QiniuConfig) {
	q.cfg = cfg
	q.Reload()
}

func (q *QiniuService) GetConfig() QiniuConfig {
	return q.cfg
}

// 3) 返回外链
func (q *QiniuService) PublicURL(key string) string {
	return "https://" + q.cfg.Domain + "/" + key
}
