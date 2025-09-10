package ws

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"

	"gin-notebook/internal/pkg/realtime/presence"
)

type Server struct {
	Rdb      *redis.Client
	TTL      time.Duration
	upgrader websocket.Upgrader

	allConns map[*Client]struct{}
}

func NewServer(rdb *redis.Client, ttl time.Duration) *Server {
	s := &Server{
		Rdb: rdb,
		TTL: ttl,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		allConns: make(map[*Client]struct{}),
	}
	go s.listenProjectDirty()
	return s
}

// 订阅 presence:project:* 的聚合脏事件
func (s *Server) listenProjectDirty() {
	ps := presence.PSubscribeProjects(s.Rdb)
	defer ps.Close()
	for {
		msg, err := ps.ReceiveMessage(context.Background())
		if err != nil {
			time.Sleep(time.Second)
			continue
		}
		parts := strings.Split(msg.Channel, ":")
		if len(parts) >= 3 {
			projectID := parts[2]
			s.broadcastProjectToLocal(projectID)
		}
	}
}

func (s *Server) addConn(c *Client) { s.allConns[c] = struct{}{} }
func (s *Server) delConn(c *Client) { delete(s.allConns, c) }

// 广播给本机订阅了 project_presence:{projectID} 的连接
func (s *Server) broadcastProjectToLocal(projectID string) {
	m, err := presence.ListProject(context.Background(), s.Rdb, projectID, s.TTL)
	if err != nil {
		return
	}
	msg := Outgoing{
		Type: "presence_state",
		Room: "project_presence:" + projectID,
		Payload: map[string]interface{}{
			"online": m, // map[taskID][]UserPresence
		},
	}
	for c := range s.allConns {
		if _, ok := c.subRooms[msg.Room]; ok {
			c.sendJSON(msg)
		}
	}
}

// 单播（新订阅时立即下发快照）
func (s *Server) broadcastProjectToOne(projectID string, c *Client) {
	m, err := presence.ListProject(context.Background(), s.Rdb, projectID, s.TTL)
	if err != nil {
		return
	}
	c.sendJSON(Outgoing{
		Type:    "presence_state",
		Room:    "project_presence:" + projectID,
		Payload: map[string]interface{}{"online": m},
	})
}

// Gin 路由处理：/api/v1/realtime/ws?workspace_id=...（可选）
// 鉴权信息从中间件注入的上下文中读取
func (s *Server) Handle(c *gin.Context) {
	fmt.Println("context", c.Keys)
	user := presence.UserPresence{
		UserID: getInt64(c, "userID"),
		Name:   getString(c, "nickname"),
		Avatar: getString(c, "avatar"),
	}
	conn, err := s.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	cl := &Client{
		s:           s,
		conn:        conn,
		user:        user,
		subRooms:    make(map[string]struct{}),
		activeTasks: make(map[string]string), // taskID -> projectID
	}
	s.addConn(cl)
	cl.run()
}

func getInt64(c *gin.Context, key string) int64 {
	if v, ok := c.Get(key); ok {
		switch t := v.(type) {
		case int64:
			return t
		case int:
			return int64(t)
		case string:
			// 你的 JWT 里若是 string，可自行转换；这里简化省略错误
			// n, _ := strconv.ParseInt(t, 10, 64); return n
			return 0
		}
	}
	return 0
}
func getString(c *gin.Context, key string) string {
	if v, ok := c.Get(key); ok {
		if s, ok2 := v.(string); ok2 {
			return s
		}
	}
	return ""
}
