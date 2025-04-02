package cache

import (
	"context"
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/pkg/logger"

	"github.com/redis/go-redis/v9"
)

// RedisClient 是 Redis 客户端的全局变量
var RedisClient *redis.Client

func InitRedisClinet(c configs.Config) error {
	// 连接 Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: c.Cache.Host + ":" + c.Cache.Port, // Redis 地址
		DB:   0,                                 // Redis 数据库
	})
	msg := map[string]interface{}{
		"host": c.Cache.Host,
		"port": c.Cache.Port,
		"db":   c.Cache.DB,
	}
	logger.LogDebug("redis connecting:", msg)
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.LogError(err, "redis connect error")
		return fmt.Errorf("failed to close redis connection: %v", err)
	}
	logger.LogDebug("redis connect success: ", msg)
	RedisClient = rdb
	return nil
}

func GetRedisClient() *redis.Client {
	// 如果 RedisClient 为 nil，则初始化 RedisClient
	return RedisClient
}

func CloseRedisClient() {
	// 关闭 Redis 连接
	if RedisClient != nil {
		_ = RedisClient.Close()
	}
}
