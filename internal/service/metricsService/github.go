package metricsService

import (
	"context"
	"errors"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/metrics"
	"gin-notebook/pkg/logger"

	"github.com/jinzhu/copier"
	"github.com/redis/go-redis/v9"
)

func GetGitHubRepoMetrics(ctx context.Context) (int, *dto.GitHubRepoMetricsDTO) {
	data := &dto.GitHubRepoMetricsDTO{}

	cacheRepo, err := cache.RedisInstance.GetGithubRepoData(ctx)
	if err == nil {
		if copyErr := copier.Copy(data, cacheRepo); copyErr != nil {
			logger.LogError(copyErr, "缓存数据转换失败")
			return message.ERROR_REDIS, nil
		}
		return message.SUCCESS, data
	}

	if !errors.Is(err, redis.Nil) {
		logger.LogError(err, "获取GitHub数据缓存失败")
		return message.ERROR_REDIS, nil
	}

	presentRepo, err := metrics.GetRepoMetrics(ctx)
	if err != nil {
		logger.LogError(err, "获取GitHub数据失败")
		return message.ERROR_GITHUB_ERROR, nil
	}

	if err := cache.RedisInstance.SetGithubRepoData(ctx, presentRepo); err != nil {
		logger.LogError(err, "写入GitHub数据缓存失败")
	}

	if err := copier.Copy(data, presentRepo); err != nil {
		logger.LogError(err, "GitHub数据转换失败")
		return message.ERROR_GITHUB_ERROR, nil
	}

	return message.SUCCESS, data
}
