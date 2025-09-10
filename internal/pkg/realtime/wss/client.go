package ws

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	"gin-notebook/internal/pkg/realtime/presence"
)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = 20 * time.Second
)

type Client struct {
	s    *Server
	conn *websocket.Conn
	user presence.UserPresence

	subRooms    map[string]struct{} // 订阅的房间（仅 project_presence:{pid}）
	activeTasks map[string]string   // taskID -> projectID（正在“露脸”的任务集合）
}

func (c *Client) run() {
	// 读循环（处理客户端消息）
	c.conn.SetReadLimit(1024)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	go c.writeLoop()
	c.readLoop()
}

func (c *Client) readLoop() {
	defer c.close()
	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		var in Incoming
		if err := json.Unmarshal(data, &in); err != nil {
			continue
		}
		c.handleIncoming(in)
	}
}

func (c *Client) handleIncoming(in Incoming) {
	switch in.Type {
	case "subscribe":
		for _, r := range in.Rooms {
			if _, ok := c.subRooms[r]; ok {
				continue
			}
			c.subRooms[r] = struct{}{}
			if strings.HasPrefix(r, "project_presence:") {
				pid := strings.TrimPrefix(r, "project_presence:")
				c.s.broadcastProjectToOne(pid, c)
			}
		}
	case "unsubscribe":
		for _, r := range in.Rooms {
			delete(c.subRooms, r)
		}
	case "focus_task":
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		c.activeTasks[in.TaskID] = in.ProjectID
		_ = presence.Touch(context.Background(), c.s.Rdb, in.TaskID, c.user, c.s.TTL)
		_ = presence.AddTaskToProject(context.Background(), c.s.Rdb, in.ProjectID, in.TaskID, c.s.TTL)
		_ = presence.PublishProjectDirty(context.Background(), c.s.Rdb, in.ProjectID)
	case "blur_task":
		if in.ProjectID == "" || in.TaskID == "" {
			return
		}
		if pid, ok := c.activeTasks[in.TaskID]; ok {
			delete(c.activeTasks, in.TaskID)
			_ = presence.Remove(context.Background(), c.s.Rdb, in.TaskID, c.user.UserID)
			presence.RemoveTaskFromProjectIfEmpty(context.Background(), c.s.Rdb, pid, in.TaskID)
			_ = presence.PublishProjectDirty(context.Background(), c.s.Rdb, pid)
		}
	case "ping":
		c.sendJSON(Outgoing{Type: "pong"})
	}
}

func (c *Client) writeLoop() {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()
	for range ticker.C {
		// 维护活跃 task 心跳
		for tid := range c.activeTasks {
			_ = presence.Touch(context.Background(), c.s.Rdb, tid, c.user, c.s.TTL)
		}
		_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			return
		}
	}
}

func (c *Client) sendJSON(v interface{}) {
	_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
	if err := c.conn.WriteJSON(v); err != nil {
		log.Println("ws write err:", err)
	}
}

func (c *Client) close() {
	// 清理 activeTasks（优雅下线）
	for tid, pid := range c.activeTasks {
		_ = presence.Remove(context.Background(), c.s.Rdb, tid, c.user.UserID)
		presence.RemoveTaskFromProjectIfEmpty(context.Background(), c.s.Rdb, pid, tid)
		_ = presence.PublishProjectDirty(context.Background(), c.s.Rdb, pid)
	}
	c.s.delConn(c)
	_ = c.conn.Close()
}
