package google

import (
	"context"
	"fmt"
	"gin-notebook/configs"

	"golang.org/x/oauth2"
	oauth2api "google.golang.org/api/oauth2/v2" // Google OAuth2 API 客户端库

	"google.golang.org/api/option"
)

type GoogleClient struct {
	ClientID string
	Secret   string
	APIKey   string
}

var Google *GoogleClient

func (g *GoogleClient) LoadConfig(ClientID string, Secret string, APIKey string) {
	g.ClientID = ClientID
	g.Secret = Secret
	g.APIKey = APIKey
}

func (g *GoogleClient) OAuth2(token string) (*oauth2api.Userinfo, error) {
	ctx := context.Background()
	tokenSrc := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token})
	httpClient := oauth2.NewClient(ctx, tokenSrc)

	// 使用 Google OAuth2 API 获取用户信息
	service, err := oauth2api.NewService(ctx, option.WithHTTPClient(httpClient))
	if err != nil {
		fmt.Println("1:", err)
		return nil, fmt.Errorf(": %v", err)
	}
	fmt.Print(token)
	// 调用 Google OAuth2 的 tokeninfo API 来验证 token
	userInfo, err := service.Userinfo.Get().Do()
	if err != nil {
		fmt.Println("2:", err)
		return nil, fmt.Errorf("unable to fetch tokeninfo: %v", err)
	}
	fmt.Printf("Token Info: %+v\n", userInfo)
	return userInfo, nil
}

func Init(c *configs.Config) {
	Google = &GoogleClient{
		ClientID: c.Google.ClientID,
	}
}
