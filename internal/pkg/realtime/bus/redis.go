package bus

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	wsChProject = "project_events:" // project_events:{projectID}
	wsChTask    = "task_events:"    // task_events:{taskID}
)

// —— 发布实现 —— //
type RedisWsPublisher struct{ rdb *redis.Client }

func NewRedisWsPublisher(rdb *redis.Client) *RedisWsPublisher { return &RedisWsPublisher{rdb: rdb} }

func (b *RedisWsPublisher) PublishProject(ctx context.Context, projectID string, evt WsEvent) error {
	evt.ProjectID = projectID
	raw, _ := json.Marshal(evt)
	return b.rdb.Publish(ctx, wsChProject+projectID, raw).Err()
}

func (b *RedisWsPublisher) PublishTask(ctx context.Context, taskID string, evt WsEvent) error {
	evt.TaskID = taskID
	raw, _ := json.Marshal(evt)
	return b.rdb.Publish(ctx, wsChTask+taskID, raw).Err()
}

// —— 订阅辅助：给 realtimeService 使用 —— //
func PSubscribeWsProjects(rdb *redis.Client) *redis.PubSub {
	return rdb.PSubscribe(context.Background(), wsChProject+"*")
}
func PSubscribeWsTasks(rdb *redis.Client) *redis.PubSub {
	return rdb.PSubscribe(context.Background(), wsChTask+"*")
}

// 从 redis 消息反解 WsEvent，并补全 {project,task}ID（从 channel 提取，防止事件体缺失）
func DecodeWsEventFromRedis(channel string, payload string) (WsEvent, bool) {
	var e WsEvent
	if json.Unmarshal([]byte(payload), &e) != nil {
		return WsEvent{}, false
	}
	if strings.HasPrefix(channel, wsChProject) && e.ProjectID == "" {
		e.ProjectID = strings.TrimPrefix(channel, wsChProject)
	}
	if strings.HasPrefix(channel, wsChTask) && e.TaskID == "" {
		e.TaskID = strings.TrimPrefix(channel, wsChTask)
	}
	return e, true
}

// 示例：阻塞读取（也可直接在 realtimeService 里手写）
func SubscribeWsTasksLoop(ctx context.Context, rdb *redis.Client, handle func(WsEvent)) {
	ps := PSubscribeWsTasks(rdb)
	defer ps.Close()
	for {
		msg, err := ps.ReceiveMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			time.Sleep(time.Second)
			continue
		}
		if e, ok := DecodeWsEventFromRedis(msg.Channel, msg.Payload); ok {
			handle(e)
		}
	}
}
