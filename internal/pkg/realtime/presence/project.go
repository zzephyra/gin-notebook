package presence

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	projTasksFmt = "presence:project:%s:tasks" // Set(taskID)
	projChanFmt  = "presence:project:%s"       // Pub/Sub channel
)

func ListProject(ctx context.Context, rdb *redis.Client, projectID string, ttl time.Duration) (map[string][]UserPresence, error) {
	taskSet := fmt.Sprintf(projTasksFmt, projectID)
	taskIDs, err := rdb.SMembers(ctx, taskSet).Result()
	if err != nil {
		return nil, err
	}
	out := make(map[string][]UserPresence, len(taskIDs))
	for _, tid := range taskIDs {
		users, err := List(ctx, rdb, tid, ttl)
		if err != nil {
			continue
		}
		if len(users) == 0 {
			_ = rdb.SRem(ctx, taskSet, tid).Err()
			continue
		}
		_ = rdb.Expire(ctx, taskSet, 2*ttl).Err()
		out[tid] = users
	}
	return out, nil
}

func AddTaskToProject(ctx context.Context, rdb *redis.Client, projectID, taskID string, ttl time.Duration) error {
	key := fmt.Sprintf(projTasksFmt, projectID)
	pipe := rdb.TxPipeline()
	pipe.SAdd(ctx, key, taskID)
	pipe.Expire(ctx, key, 2*ttl)
	_, err := pipe.Exec(ctx)
	return err
}

func RemoveTaskFromProjectIfEmpty(ctx context.Context, rdb *redis.Client, projectID, taskID string) {
	taskKey := fmt.Sprintf(keyFmt, taskID)
	projSet := fmt.Sprintf(projTasksFmt, projectID)
	if n, _ := rdb.HLen(ctx, taskKey).Result(); n == 0 {
		_ = rdb.SRem(ctx, projSet, taskID).Err()
	}
}

func PublishProjectDirty(ctx context.Context, rdb *redis.Client, projectID string) error {
	ch := fmt.Sprintf(projChanFmt, projectID)
	return rdb.Publish(ctx, ch, "dirty").Err()
}

func PSubscribeProjects(rdb *redis.Client) *redis.PubSub {
	return rdb.PSubscribe(context.Background(), "presence:project:*")
}
