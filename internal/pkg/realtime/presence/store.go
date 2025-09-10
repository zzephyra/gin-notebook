package presence

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	keyFmt     = "presence:task:%s" // Hash(userID -> JSON(UserPresence))
	DefaultTTL = 60 * time.Second
)

type UserPresence struct {
	UserID   int64  `json:"user_id,string"`
	Name     string `json:"name"`
	Avatar   string `json:"avatar"`
	LastSeen int64  `json:"last_seen"`
}

func Touch(ctx context.Context, rdb *redis.Client, taskID string, up UserPresence, ttl time.Duration) error {
	key := fmt.Sprintf(keyFmt, taskID)
	up.LastSeen = time.Now().Unix()
	data, _ := json.Marshal(up)
	pipe := rdb.TxPipeline()
	pipe.HSet(ctx, key, strconv.FormatInt(up.UserID, 10), data)
	pipe.Expire(ctx, key, ttl*2)
	_, err := pipe.Exec(ctx)
	return err
}

func Remove(ctx context.Context, rdb *redis.Client, taskID string, userID int64) error {
	key := fmt.Sprintf(keyFmt, taskID)
	return rdb.HDel(ctx, key, strconv.FormatInt(userID, 10)).Err()
}

func List(ctx context.Context, rdb *redis.Client, taskID string, ttl time.Duration) ([]UserPresence, error) {
	key := fmt.Sprintf(keyFmt, taskID)
	m, err := rdb.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, err
	}
	cut := time.Now().Unix() - int64(ttl.Seconds())
	out := make([]UserPresence, 0, len(m))
	for _, raw := range m {
		var up UserPresence
		if json.Unmarshal([]byte(raw), &up) == nil && up.LastSeen >= cut {
			out = append(out, up)
		}
	}
	return out, nil
}
