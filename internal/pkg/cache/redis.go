package cache

import (
	"context"
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient 是 Redis 客户端的全局变量

var (
	GategoryMapKey = "note_category"
)

type RedisClient struct {
	Client *redis.Client
}

var RedisInstance *RedisClient

func StorageNoteCategory(rdb *redis.Client) error {
	var err error
	var ctx = context.Background()
	data, err := repository.GetNoteCategoryMap()
	if err != nil {
		return err
	}
	logger.LogInfo("get note category", map[string]interface{}{
		"data": data,
	})
	categories := make(map[int64]string)
	for _, v := range *data {
		categories[v.ID] = v.CategoryName
	}
	rdb.HSet(ctx, GategoryMapKey, categories)
	return nil
}

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
	RedisInstance = &RedisClient{
		Client: rdb,
	}
	if err := StorageNoteCategory(rdb); err != nil {
		logger.LogError(err, "failed to cache note category")
		return err
	}
	return nil
}

func (r *RedisClient) SetWithContext(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if ctx == nil {
		ctx = context.Background()
	}
	err := r.Client.Set(ctx, key, value, expiration).Err()
	if err != nil {
		logger.LogError(err, "failed to set redis key")
		return err
	}
	return nil
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	return r.SetWithContext(context.Background(), key, value, expiration)
}

func (r *RedisClient) Get(key string) (string, error) {
	ctx := context.Background()
	val, err := r.Client.Get(ctx, key).Result()
	if err != nil {
		logger.LogError(err, "failed to get redis key")
		return "", err
	}
	return val, nil
}

func (r *RedisClient) SetCaptcha(key string, value string) error {
	// 设置验证码，过期时间为 30 分钟
	// Todo: 需要将时常放置在redis内，以便后续动态调整
	key = key + "_captcha"
	if err := r.Set(key, value, 30*time.Minute); err != nil {
		return err
	}
	return nil
}

func (r *RedisClient) GetCaptcha(key string) (string, error) {
	// 获取验证码，获取后删除
	key = key + "_captcha"
	val, err := r.Get(key)
	if err != nil {
		logger.LogError(err, "failed to get redis key")
		return "", err
	}
	_, err = r.Del(key)
	if err != nil {
		return "", err
	}
	return val, nil
}

func (r *RedisClient) Del(key ...string) (int64, error) {
	num, err := r.Client.Del(context.Background(), key...).Result()
	if err != nil {
		logger.LogError(err, "failed to delete redis key")
		return 0, err
	}
	return num, nil
}

func (r *RedisClient) Close() error {
	if err := r.Client.Close(); err != nil {
		logger.LogError(err, "failed to close redis connection")
		return fmt.Errorf("failed to close redis connection: %v", err)
	}
	logger.LogDebug("redis connection closed", map[string]interface{}{})
	return nil
}

func (r *RedisClient) GetNoteCategoryMap(CategoryID int64) (string, error) {
	ctx := context.Background()
	val, err := r.Client.HGet(ctx, GategoryMapKey, strconv.FormatInt(CategoryID, 10)).Result()
	if err != nil {
		logger.LogError(err, "failed to get redis key")
		return "", err
	}
	return val, nil
}
