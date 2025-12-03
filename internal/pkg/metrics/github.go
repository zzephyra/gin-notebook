package metrics

import (
	"context"
	"gin-notebook/configs"
	"sync"

	"github.com/google/go-github/v79/github"
	"golang.org/x/oauth2"
)

var (
	client     *github.Client
	clientOnce sync.Once
)

func GetClient() *github.Client {
	clientOnce.Do(func() {
		ctx := context.Background()

		option := &oauth2.Token{}

		if configs.Configs.Github.Token != "" {
			option.AccessToken = configs.Configs.Github.Token
		}

		ts := oauth2.StaticTokenSource(
			option,
		)
		tc := oauth2.NewClient(ctx, ts)

		client = github.NewClient(tc)
	})

	return client
}

func GetRepoMetrics(ctx context.Context) (*github.Repository, error) {
	client := GetClient()

	if ctx == nil {
		ctx = context.Background()
	}

	if configs.Configs.Github.Owner == "" || configs.Configs.Github.Repo == "" {
		return nil, nil
	}

	r, _, err := client.Repositories.Get(ctx, configs.Configs.Github.Owner, configs.Configs.Github.Repo)
	if err != nil {
		return nil, err
	}
	return r, nil
}
