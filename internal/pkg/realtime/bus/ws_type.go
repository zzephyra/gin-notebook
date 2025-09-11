package bus

import "context"

type EventType string

const (
	WsProjectDirty   EventType = "project_dirty"
	WsCommentAdded   EventType = "comment_added"
	WsCommentRemoved EventType = "comment_removed"
)

type WsEvent struct {
	Type      EventType      `json:"type"`
	ProjectID string         `json:"project_id,omitempty"`
	TaskID    string         `json:"task_id,omitempty"`
	Payload   map[string]any `json:"payload,omitempty"`
}

type WsSubscriber interface {
	// 阻塞式接收，分别订阅项目/任务主题（内部可用 Redis pattern）
	SubscribeProjects(ctx context.Context) (<-chan WsEvent, error)
	SubscribeTasks(ctx context.Context) (<-chan WsEvent, error)
}
