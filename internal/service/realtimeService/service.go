package realtimeService

import (
	"context"
	"encoding/json"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"gin-notebook/internal/pkg/realtime/presence"
)

const (
	roomPrefix = "project_presence:" // room = project_presence:{projectID}
)

// —— WS 消息协议 —— //
type Incoming struct {
	Type      string   `json:"type"`                 // subscribe | unsubscribe | focus_task | blur_task | ping
	Rooms     []string `json:"rooms,omitempty"`      // ["project_presence:123"]
	ProjectID string   `json:"project_id,omitempty"` // for focus/blur
	TaskID    string   `json:"task_id,omitempty"`    // for focus/blur
}
type Outgoing struct {
	Type    string      `json:"type"` // presence_state | pong
	Room    string      `json:"room"`
	Payload interface{} `json:"payload,omitempty"`
}

type User = presence.UserPresence

// —— 连接抽象（由 handler 适配） —— //
type Conn interface {
	SendJSON(any) error
	Ping() error
	Close() error
}

// —— 每个客户端状态 —— //
type client struct {
	svc         *Service
	conn        Conn
	user        User
	subRooms    map[string]struct{} // 订阅的房间（仅 project_presence:{pid}）
	activeTasks map[string]string   // taskID -> projectID（正在“露脸”的任务）
	mu          sync.RWMutex
	closed      chan struct{}
}

func (c *client) hasSub(room string) bool {
	c.mu.RLock()
	_, ok := c.subRooms[room]
	c.mu.RUnlock()
	return ok
}

// —— 业务服务 —— //
type Service struct {
	rdb *redis.Client
	ttl time.Duration

	mu      sync.RWMutex
	clients map[*client]struct{}
	once    sync.Once
}

func New(rdb *redis.Client, ttl time.Duration) *Service {
	s := &Service{
		rdb:     rdb,
		ttl:     ttl,
		clients: make(map[*client]struct{}),
	}
	// 订阅项目级脏事件
	s.once.Do(func() { go s.listenProjectDirty() })
	return s
}

// —— 生命周期 —— //
func (s *Service) Attach(conn Conn, user User) *client {
	c := &client{
		svc:         s,
		conn:        conn,
		user:        user,
		subRooms:    make(map[string]struct{}),
		activeTasks: make(map[string]string),
		closed:      make(chan struct{}),
	}
	s.mu.Lock()
	s.clients[c] = struct{}{}
	s.mu.Unlock()

	// 启动心跳任务
	go s.heartbeat(c)
	return c
}

func (s *Service) Detach(c *client) {
	// 优雅下线：从所有活跃 task 移除并广播
	c.mu.Lock()
	active := make(map[string]string, len(c.activeTasks))
	for tid, pid := range c.activeTasks {
		active[tid] = pid
	}
	c.activeTasks = map[string]string{}
	c.mu.Unlock()

	for tid, pid := range active {
		_ = presence.Remove(context.Background(), s.rdb, tid, c.user.UserID)
		presence.RemoveTaskFromProjectIfEmpty(context.Background(), s.rdb, pid, tid)
		_ = presence.PublishProjectDirty(context.Background(), s.rdb, pid)
	}

	close(c.closed)

	s.mu.Lock()
	delete(s.clients, c)
	s.mu.Unlock()

	_ = c.conn.Close()
}

// —— 处理一条来自 handler 的消息 —— //
func (s *Service) Handle(c *client, in Incoming) {
	switch in.Type {
	case "subscribe":
		for _, r := range in.Rooms {
			c.mu.Lock()
			_, exists := c.subRooms[r]
			if !exists && isProjectRoom(r) {
				c.subRooms[r] = struct{}{}
			}
			c.mu.Unlock()
			if !exists && isProjectRoom(r) {
				pid := strings.TrimPrefix(r, roomPrefix)
				s.unicastProject(pid, c) // 首次订阅发快照
			}
		}
	case "unsubscribe":
		for _, r := range in.Rooms {
			c.mu.Lock()
			delete(c.subRooms, r)
			c.mu.Unlock()
		}
	case "focus_task":
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		c.mu.Lock()
		c.activeTasks[in.TaskID] = in.ProjectID
		c.mu.Unlock()

		_ = presence.Touch(context.Background(), s.rdb, in.TaskID, c.user, s.ttl)
		_ = presence.AddTaskToProject(context.Background(), s.rdb, in.ProjectID, in.TaskID, s.ttl)
		_ = presence.PublishProjectDirty(context.Background(), s.rdb, in.ProjectID)

	case "blur_task":
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		c.mu.Lock()
		delete(c.activeTasks, in.TaskID)
		c.mu.Unlock()

		_ = presence.Remove(context.Background(), s.rdb, in.TaskID, c.user.UserID)
		presence.RemoveTaskFromProjectIfEmpty(context.Background(), s.rdb, in.ProjectID, in.TaskID)
		_ = presence.PublishProjectDirty(context.Background(), s.rdb, in.ProjectID)

	case "ping":
		_ = c.conn.SendJSON(Outgoing{Type: "pong"})
	}
}

// —— 心跳：每 20s 续命活跃 task，并发送 ws ping —— //
func (s *Service) heartbeat(c *client) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-c.closed:
			return
		case <-ticker.C:
			c.mu.RLock()
			for tid := range c.activeTasks {
				_ = presence.Touch(context.Background(), s.rdb, tid, c.user, s.ttl)
			}
			c.mu.RUnlock()
			_ = c.conn.Ping()
		}
	}
}

// —— 项目脏事件订阅 & 广播 —— //
func (s *Service) listenProjectDirty() {
	ps := presence.PSubscribeProjects(s.rdb)
	defer ps.Close()
	for {
		msg, err := ps.ReceiveMessage(context.Background())
		if err != nil {
			time.Sleep(time.Second)
			continue
		}
		parts := strings.Split(msg.Channel, ":")
		if len(parts) >= 3 {
			pid := parts[2]
			s.broadcastProject(pid)
		}
	}
}

func (s *Service) broadcastProject(projectID string) {
	m, err := presence.ListProject(context.Background(), s.rdb, projectID, s.ttl)
	if err != nil {
		return
	}
	out := Outgoing{
		Type:    "presence_state",
		Room:    roomPrefix + projectID,
		Payload: map[string]any{"online": m},
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	for c := range s.clients {
		if c.hasSub(out.Room) {
			_ = c.conn.SendJSON(out)
		}
	}
}

func (s *Service) unicastProject(projectID string, c *client) {
	m, err := presence.ListProject(context.Background(), s.rdb, projectID, s.ttl)
	if err != nil {
		return
	}
	_ = c.conn.SendJSON(Outgoing{
		Type:    "presence_state",
		Room:    roomPrefix + projectID,
		Payload: map[string]any{"online": m},
	})
}

// —— helpers —— //
func isProjectRoom(r string) bool { return strings.HasPrefix(r, roomPrefix) }

// JSON helpers（可用于未来服务内部直发）
func marshal(v any) []byte { b, _ := json.Marshal(v); return b }
