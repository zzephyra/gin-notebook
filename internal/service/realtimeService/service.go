// file: internal/service/realtimeService/service.go
package realtimeService

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/realtime/bus"
	"gin-notebook/internal/pkg/realtime/presence"
	"gin-notebook/internal/pkg/realtime/protocol"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/tools"
)

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
	user        presence.UserPresence
	subRooms    map[string]struct{} // 已订阅房间（project_presence:{pid} / task_events:{tid}）
	activeTasks map[string]string   // taskID -> projectID（当前“聚焦”的任务）
	mu          sync.RWMutex
	closed      chan struct{}
}

func (c *client) hasSub(room string) bool {
	c.mu.RLock()
	_, ok := c.subRooms[room]
	c.mu.RUnlock()
	return ok
}

// —— 实时服务 —— //
type Service struct {
	rdb *redis.Client
	ttl time.Duration

	// 用于兼容从 WS 指令路径里发布事件（推荐逐步下线，改为 HTTP 创建后在业务层发布）
	pub bus.WsPublisher

	mu      sync.RWMutex
	clients map[*client]struct{}
	once    sync.Once
}

// New：构造服务并启动项目脏事件订阅 + 任务事件订阅（由 bus 层提供订阅循环）
func New(rdb *redis.Client, ttl time.Duration, pub bus.WsPublisher) *Service {
	s := &Service{
		rdb:     rdb,
		ttl:     ttl,
		pub:     pub,
		clients: make(map[*client]struct{}),
	}
	s.once.Do(func() {
		go s.listenProjectDirty()
		go s.listenTaskEvents()
	})
	return s
}

// —— 生命周期 —— //
func (s *Service) Attach(conn Conn, user presence.UserPresence) *client {
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

	go s.heartbeat(c)
	return c
}

func (s *Service) Detach(c *client) {
	// 拍快照，避免长锁
	c.mu.Lock()
	active := make(map[string]string, len(c.activeTasks))
	for tid, pid := range c.activeTasks {
		active[tid] = pid
	}
	c.activeTasks = map[string]string{}
	c.mu.Unlock()

	// 优雅下线：从所有活跃 task 移除并触发项目 presence 脏事件
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

// —— 处理来自客户端的一条消息 —— //
func (s *Service) Handle(c *client, in protocol.Incoming) {
	switch in.Type {

	case "subscribe":
		for _, r := range in.Rooms {
			c.mu.Lock()
			_, exists := c.subRooms[r]
			// 项目房间
			if !exists && protocol.IsProjectRoom(r) {
				c.subRooms[r] = struct{}{}
			}
			// 任务房间（允许直接订阅）
			if protocol.IsTaskRoom(r) {
				c.subRooms[r] = struct{}{}
			}
			c.mu.Unlock()

			// 首次订阅项目 → 下发 presence 快照
			if !exists && protocol.IsProjectRoom(r) {
				pid := strings.TrimPrefix(r, protocol.RoomPrefixProject)
				s.unicastProject(pid, c)
			}
		}

	case "unsubscribe":
		for _, r := range in.Rooms {
			c.mu.Lock()
			delete(c.subRooms, r)
			c.mu.Unlock()
		}

	case "focus_task":
		// 进入任务详情：订阅任务房间 + presence 续命 + 项目脏事件
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		c.mu.Lock()
		c.activeTasks[in.TaskID] = in.ProjectID
		c.subRooms[protocol.TaskRoom(in.TaskID)] = struct{}{}
		c.mu.Unlock()

		_ = presence.Touch(context.Background(), s.rdb, in.TaskID, c.user, s.ttl)
		_ = presence.AddTaskToProject(context.Background(), s.rdb, in.ProjectID, in.TaskID, s.ttl)
		_ = presence.PublishProjectDirty(context.Background(), s.rdb, in.ProjectID)

	case "blur_task":
		// 离开任务详情：退订任务房间 + presence 清理 + 项目脏事件
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		c.mu.Lock()
		delete(c.activeTasks, in.TaskID)
		delete(c.subRooms, protocol.TaskRoom(in.TaskID))
		c.mu.Unlock()

		_ = presence.Remove(context.Background(), s.rdb, in.TaskID, c.user.UserID)
		presence.RemoveTaskFromProjectIfEmpty(context.Background(), s.rdb, in.ProjectID, in.TaskID)
		_ = presence.PublishProjectDirty(context.Background(), s.rdb, in.ProjectID)

	// —— 兼容路径：前端通过 WS 告知“已创建评论”，这里查库并发布到 bus（推荐逐步下线此分支）
	case "add_comment":
		if in.ProjectID == "" || in.TaskID == "" || in.CommentID == "" {
			return
		}
		commentID, err := strconv.ParseInt(in.CommentID, 10, 64)
		if err != nil {
			return
		}
		comment, err := repository.GetCommentByID(database.DB, commentID, c.user.UserID) // 权限校验 + 确认存在
		if err != nil || comment == nil {
			return
		}
		attachments, _ := repository.GetCommentAttachmentByCommentID(database.DB, comment.ID)

		// 组装干净 DTO
		dto := tools.StructToUpdateMap(comment, nil, []string{"LastSeen"})
		dto["author"] = tools.StructToUpdateMap(c.user, nil, []string{"DeletedAt", "AuthorID", "MemberID"})
		if len(attachments) > 0 {
			dto["attachments"] = attachments
		}

		payload := map[string]any{
			"project_id": in.ProjectID,
			"task_id":    in.TaskID,
			"column_id":  in.ColumnID,
			"comment":    dto,
		}

		// 统一走 bus 发布（由本服务的订阅循环接回并转发到房间）
		if s.pub != nil {
			_ = s.pub.PublishTask(context.Background(), in.TaskID, bus.WsEvent{
				Type:      bus.WsCommentAdded,
				ProjectID: in.ProjectID,
				TaskID:    in.TaskID,
				Payload:   payload,
			})
		}

	case "ping":
		_ = c.conn.SendJSON(protocol.Outgoing{Type: "pong"})
	}
}

// —— 广播到某个房间（仅本进程内连接；多实例已由 Redis 分发事件到各实例） —— //
func (s *Service) broadcastToRoom(room string, out protocol.Outgoing) {
	out.Room = room
	s.mu.RLock()
	clients := make([]*client, 0, len(s.clients))
	for c := range s.clients {
		if c.hasSub(room) {
			clients = append(clients, c)
		}
	}
	s.mu.RUnlock()
	for _, c := range clients {
		_ = c.conn.SendJSON(out)
	}
}

// —— 心跳：每 20s 续命活跃 task，并对连接做 ping —— //
func (s *Service) heartbeat(c *client) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-c.closed:
			return
		case <-ticker.C:
			// 只读锁内快速拷贝 Key，Redis 调用在锁外
			c.mu.RLock()
			taskIDs := make([]string, 0, len(c.activeTasks))
			for tid := range c.activeTasks {
				taskIDs = append(taskIDs, tid)
			}
			c.mu.RUnlock()

			for _, tid := range taskIDs {
				_ = presence.Touch(context.Background(), s.rdb, tid, c.user, s.ttl)
			}
			_ = c.conn.Ping()
		}
	}
}

// —— 订阅“任务事件”并转发 —— //
// 由 bus 层封装 Redis 订阅循环，这里只做路由到房间
func (s *Service) listenTaskEvents() {
	ctx := context.Background()
	go bus.SubscribeTaskEventsLoop(ctx, s.rdb, func(e bus.WsEvent) {
		switch e.Type {
		case bus.WsCommentAdded:
			s.broadcastToRoom(protocol.TaskRoom(e.TaskID), protocol.Outgoing{
				Type:    "comment_added",
				Payload: e.Payload,
			})
		case bus.WsCommentRemoved:
			s.broadcastToRoom(protocol.TaskRoom(e.TaskID), protocol.Outgoing{
				Type:    "comment_removed",
				Payload: e.Payload,
			})
		}
	})
}

// —— 项目脏事件订阅 & 广播（沿用原有 presence 机制；如需可迁到 bus 层统一） —— //
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
	out := protocol.Outgoing{
		Type:    "presence_state",
		Room:    protocol.RoomPrefixProject + projectID,
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
	_ = c.conn.SendJSON(protocol.Outgoing{
		Type:    "presence_state",
		Room:    protocol.RoomPrefixProject + projectID,
		Payload: map[string]any{"online": m},
	})
}

// —— JSON 小工具 —— //
func marshal(v any) []byte { b, _ := json.Marshal(v); return b }
