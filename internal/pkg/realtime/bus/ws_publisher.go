package bus

import (
	"context"
	"fmt"
	"strconv"
	"sync"
)

var (
	defaultWsPublisher WsPublisher
	wsMu               sync.RWMutex
)

type WsPublisher interface {
	PublishProject(ctx context.Context, projectID string, evt WsEvent) error
	PublishTask(ctx context.Context, taskID string, evt WsEvent) error
}

// 在 main/startup 注入一次
func UseWsPublisher(p WsPublisher) {
	wsMu.Lock()
	defaultWsPublisher = p
	wsMu.Unlock()
}

func DefaultWsPublisher() WsPublisher {
	wsMu.RLock()
	defer wsMu.RUnlock()
	return defaultWsPublisher
}

// 便捷函数：全局发布（nil 时静默）
func PublishWsProject(ctx context.Context, projectID string, evt WsEvent) error {
	wsMu.RLock()
	p := defaultWsPublisher
	wsMu.RUnlock()
	if p == nil {
		return nil
	}
	evt.ProjectID = projectID // 兜底
	return p.PublishProject(ctx, projectID, evt)
}

func PublishWsTask(ctx context.Context, taskID string, evt WsEvent) error {
	wsMu.RLock()
	p := defaultWsPublisher
	wsMu.RUnlock()
	if p == nil {
		fmt.Println("PublishWsTask no publisher")
		return nil
	}
	fmt.Println("PublishWsTask with publisher", evt)
	evt.TaskID = taskID // 兜底
	return p.PublishTask(ctx, taskID, evt)
}

// 语义化便捷函数（业务处一行调用）
func PublishCommentAdded(ctx context.Context, taskID int64, comment map[string]any) error {
	taskIDStr := strconv.FormatInt(taskID, 10)

	return PublishWsTask(ctx, taskIDStr, WsEvent{
		Type:   WsCommentAdded,
		TaskID: taskIDStr,
		Payload: map[string]any{
			"comment": comment,
		},
	})
}
