package cache

import (
	"context"
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/pkg/logger"
	"strconv"
	"time"

	"github.com/go-redsync/redsync/v4"
	redsyncredis "github.com/go-redsync/redsync/v4/redis/goredis/v9"

	"github.com/redis/go-redis/v9"
)

// RedisClient 是 Redis 客户端的全局变量

var (
	GategoryMapKey    = "note_category"
	SystemSettingsKey = "system_settings:global"
)

type RedisClient struct {
	Client *redis.Client
	Locker *redsync.Redsync
}

var RedisInstance *RedisClient

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

	pool := redsyncredis.NewPool(rdb)
	rs := redsync.New(pool)
	RedisInstance = &RedisClient{
		Client: rdb,
		Locker: rs,
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

func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
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
	if err := r.Set(context.Background(), key, value, 30*time.Minute); err != nil {
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
	_, err = r.Del(context.Background(), key)
	if err != nil {
		return "", err
	}
	return val, nil
}

func (r *RedisClient) Del(ctx context.Context, key ...string) (int64, error) {
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

func (r *RedisClient) SaveSystemSettings(key map[string]interface{}) error {
	ctx := context.Background()
	err := r.Client.HMSet(ctx, SystemSettingsKey, key).Err()
	if err != nil {
		logger.LogError(err, "failed to get redis key")
		return err
	}
	return nil
}

func (r *RedisClient) GetCachedSystemSettings() (map[string]string, error) {
	ctx := context.Background()
	val, err := r.Client.HGetAll(ctx, SystemSettingsKey).Result()
	if err != nil {
		logger.LogError(err, "failed to get redis key")
		return map[string]string{}, err
	}
	return val, nil
}

func (l *RedisClient) Lock(ctx context.Context, key string, ttl time.Duration) (func() error, error) {
	mutex := l.Locker.NewMutex(
		key,
		redsync.WithExpiry(ttl), // 锁自动过期时间
		redsync.WithTries(1),    // 只尝试一次（不重试）
		redsync.WithRetryDelay(200*time.Millisecond),
	)

	if err := mutex.LockContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to acquire lock: %w", err)
	}

	unlock := func() error {
		_, err := mutex.UnlockContext(ctx)
		return err
	}

	return unlock, nil
}
