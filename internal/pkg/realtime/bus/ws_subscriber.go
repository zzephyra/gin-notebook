// internal/pkg/realtime/bus/ws_subscriber.go
package bus

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type TaskEventHandler func(evt WsEvent)

func SubscribeTaskEventsLoop(ctx context.Context, rdb *redis.Client, handle TaskEventHandler) {
	ps := PSubscribeWsTasks(rdb) // 来自 ws_redis.go: task_events:*
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
