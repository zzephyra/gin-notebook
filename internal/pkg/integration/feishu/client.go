package feishu

import (
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"time"

	lark "github.com/larksuite/oapi-sdk-go/v3"
	larkauth "github.com/larksuite/oapi-sdk-go/v3/service/auth/v3"
	larkauthen "github.com/larksuite/oapi-sdk-go/v3/service/authen/v1"
)

type FeishuClient interface {
	GetAccessToken() (string, error)
}

type Client struct {
	appID     string
	appSecret string
	Client    *lark.Client
}

var client *Client

func VerifyAppCredentials(appId, appSecret string) error {
	c := &Client{
		appID:     appId,
		appSecret: appSecret,
		Client:    lark.NewClient(appId, appSecret),
	}
	_, err := c.GetAppAccessToken(context.Background(), false)
	return err
}

func GetClient() *Client {
	if client == nil {
		client = &Client{}
		err := client.LoadConfigFromDatabase()
		if err != nil {
			logger.LogError(err, "Feishu LoadConfigFromDatabase error")
		}

		if client.Client == nil {
			logger.LogError(fmt.Errorf("Feishu integration not configured"), "Feishu GetClient error")
			return nil
		}
	}
	return client
}

func (c *Client) LoadConfig(appId, appSecret string) *Client {
	return &Client{
		appID:     appId,
		appSecret: appSecret,
		Client:    lark.NewClient(appId, appSecret),
	}
}

func (c *Client) LoadConfigFromDatabase() error {
	integration, err := repository.NewIntegrationRepository(database.DB).GetIntegrationAppList(context.Background(), "feishu")
	if err != nil {
		logger.LogError(err, "LoadConfigFromDatabase error")
		return err
	}

	for _, app := range integration {
		if app.Provider == "feishu" {
			fmt.Println(app.AppID, app.AppSecretEnc)
			c.Client = lark.NewClient(app.AppID, app.AppSecretEnc)
			break
		}
	}
	return nil
}

// GetAppAccessToken 获取并返回飞书应用级别的 App Access Token。
// 它将优先从 Redis 缓存（键：feishu_app_access_token_{appID}）读取，若命中则直接返回；
// 若未命中，则调用飞书开放平台内建应用 Token 接口获取最新 Token。
// 调用失败或服务端响应非成功时会记录日志并返回错误。
// 成功时从响应中解析 app_access_token 及过期时间 expire（默认 7200 秒），
// 按有效期将 Token 写入 Redis 后返回。
// 参数：
//   - ctx：请求上下文，用于控制超时与取消。
//
// 返回：
//   - string：成功获取的 App Access Token。
//   - error：当网络/SDK 调用失败、服务端错误、JSON 解析失败，或响应缺少 app_access_token 时返回。
//
// 副作用：
//   - 读取/写入 Redis 缓存；错误情况下会记录日志。
func (c *Client) GetAppAccessToken(ctx context.Context, cacheToken bool) (string, error) {
	if cacheToken {
		token, err := cache.RedisInstance.Get(fmt.Sprintf("feishu_app_access_token_%s", c.appID))
		if err == nil && token != "" {
			return token, nil
		}
	}

	req := larkauth.NewInternalAppAccessTokenReqBuilder().
		Body(larkauth.NewInternalAppAccessTokenReqBodyBuilder().
			AppId(c.appID).
			AppSecret(c.appSecret).
			Build()).
		Build()

	resp, err := c.Client.Auth.V3.AppAccessToken.Internal(ctx, req)

	if err != nil {
		logger.LogError(err, "Feishu GetAppAccessToken error")
		return "", err
	}

	// 服务端错误处理
	if !resp.Success() {
		logger.LogError(resp.CodeError, "Feishu GetAppAccessToken response error")
		return "", resp.CodeError
	}

	var data map[string]interface{}
	if err := json.Unmarshal(resp.RawBody, &data); err != nil {
		logger.LogError(err, "Feishu GetAppAccessToken json unmarshal error")
		return "", err
	}
	if token, ok := data["app_access_token"].(string); ok {
		if cacheToken {
			expSec := int64(3600)
			if v, ok := data["expire"].(float64); ok {
				expSec = int64(v) - 300 // 提前 5 分钟过期
			}
			expiration := time.Duration(expSec) * time.Second
			cache.RedisInstance.Set(fmt.Sprintf("feishu_app_access_token_%s", c.appID), token, expiration)
		}
		return token, nil
	}

	logger.LogError(fmt.Errorf("app_access_token not found in response"), "Feishu GetAppAccessToken error")
	return "", fmt.Errorf("app_access_token not found in response")
}

func (c *Client) GetUserAccessToken(ctx context.Context, code string) (*dto.FeishuUserAccessTokenResponse, error) {
	fmt.Println("GetUserAccessToken code:", code)
	req := larkauthen.NewCreateOidcAccessTokenReqBuilder().
		Body(larkauthen.NewCreateOidcAccessTokenReqBodyBuilder().
			GrantType(`authorization_code`).
			Code(code).
			Build()).
		Build()
	resp, err := c.Client.Authen.V1.OidcAccessToken.Create(context.Background(), req)
	if err != nil {
		logger.LogError(err, "Feishu GetUserAccessToken error")
		return nil, err
	}

	// 服务端错误处理
	if !resp.Success() {
		logger.LogError(resp.CodeError, "Feishu GetUserAccessToken response error")
		return nil, resp.CodeError
	}

	var wrapper struct {
		Data dto.FeishuUserAccessTokenResponse `json:"data"`
	}
	if err := json.Unmarshal(resp.RawBody, &wrapper); err != nil {
		logger.LogError(err, "Feishu GetUserAccessToken json unmarshal error")
		return nil, err
	}

	return &wrapper.Data, nil
}
