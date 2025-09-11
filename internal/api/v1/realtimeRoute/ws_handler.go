package realtimeRoute

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/realtime/presence"
	"gin-notebook/internal/pkg/realtime/protocol"
	"gin-notebook/internal/service/realtimeService"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WsHandler struct {
	Svc      *realtimeService.Service
	Upgrader websocket.Upgrader
}

func NewWsHandler(svc *realtimeService.Service) *WsHandler {
	return &WsHandler{
		Svc: svc,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (h *WsHandler) ServeWS(c *gin.Context) {
	// 从上下文获取用户信息, 统一为WorkspaceMemberDTO
	role, exists := c.Get("role")
	if !exists {
		role = []string{}
	}

	user := presence.UserPresence{
		WorkspaceMemberDTO: dto.WorkspaceMemberDTO{
			UserID:            getCtxInt64(c, "userID"),
			UserNickname:      getCtxString(c, "nickname"),
			WorkspaceNickname: getCtxString(c, "workspaceNickname"), // 可选地覆盖
			Email:             getCtxString(c, "email"),
			Avatar:            getCtxString(c, "avatar"),
			Role:              role.([]string),
		},
	}
	conn, err := h.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}

	adapter := newWSConnAdapter(conn)
	adapter.Start() // ←—— 启动 writePump

	client := h.Svc.Attach(adapter, user)
	defer h.Svc.Detach(client)

	// 读循环
	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetReadLimit(1024)
	conn.SetPongHandler(func(string) error {
		_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	conn.SetCloseHandler(func(code int, text string) error {
		// 触发 readLoop 返回 → Detach
		return nil
	})

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var in protocol.Incoming
		if err := json.Unmarshal(data, &in); err != nil {
			continue
		}
		h.Svc.Handle(client, in)
	}
}

func getCtxInt64(c *gin.Context, key string) int64 {
	if v, ok := c.Get(key); ok {
		switch t := v.(type) {
		case int64:
			return t
		case int:
			return int64(t)
		case string:
			// 如你的中间件把 user_id 放 string，可按需转换
			// n, _ := strconv.ParseInt(t, 10, 64); return n
			return 0
		}
	}
	return 0
}
func getCtxString(c *gin.Context, key string) string {
	if v, ok := c.Get(key); ok {
		if s, ok2 := v.(string); ok2 {
			return s
		}
	}
	return ""
}

// ======================
// WebSocket → Service.Conn 适配器（带 writePump）
// ======================

type wsFrameKind int

const (
	frameJSON wsFrameKind = iota + 1
	framePing
	frameClose
)

type wsFrame struct {
	kind    wsFrameKind
	payload []byte // frameJSON 时为 JSON；ping/close 不用
}

type wsConnAdapter struct {
	Conn       *websocket.Conn
	out        chan wsFrame
	done       chan struct{}
	closeOnce  sync.Once
	writeWait  time.Duration
	bufferSize int
}

// 创建适配器
func newWSConnAdapter(c *websocket.Conn) *wsConnAdapter {
	return &wsConnAdapter{
		Conn:       c,
		out:        make(chan wsFrame, 128), // 根据吞吐量调整
		done:       make(chan struct{}),
		writeWait:  10 * time.Second,
		bufferSize: 128,
	}
}

// 启动 writePump（一个 goroutine 串行写 socket）
func (a *wsConnAdapter) Start() {
	go a.writePump()
}

func (a *wsConnAdapter) writePump() {
	defer func() {
		// 统一收尾：关闭底层连接
		_ = a.Conn.Close()
	}()

	for {
		select {
		case <-a.done:
			return

		case frame, ok := <-a.out:
			if !ok {
				return
			}

			deadline := time.Now().Add(a.writeWait)
			_ = a.Conn.SetWriteDeadline(deadline)

			switch frame.kind {
			case frameJSON:
				// 串行写 JSON 文本帧
				if err := a.Conn.WriteMessage(websocket.TextMessage, frame.payload); err != nil {
					return
				}

			case framePing:
				// 串行写控制帧（ping）
				if err := a.Conn.WriteControl(websocket.PingMessage, nil, deadline); err != nil {
					return
				}

			case frameClose:
				// 发送关闭帧后结束
				_ = a.Conn.WriteControl(
					websocket.CloseMessage,
					websocket.FormatCloseMessage(websocket.CloseNormalClosure, "bye"),
					deadline,
				)
				return
			}
		}
	}
}

// —— Service.Conn 接口实现：全部改为“入队”，不直接写 socket ——

// SendJSON：将 JSON 消息入队，由 writePump 串行写
func (a *wsConnAdapter) SendJSON(v any) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	select {
	case a.out <- wsFrame{kind: frameJSON, payload: b}:
		return nil
	case <-a.done:
		return websocket.ErrCloseSent
	default:
		// 出站缓冲已满：保护性关闭，避免 OOM（也可以改成“丢弃旧消息”策略）
		a.Close()
		return websocket.ErrCloseSent
	}
}

// Ping：入队一个 ping 控制帧，由 writePump 统一发送
func (a *wsConnAdapter) Ping() error {
	select {
	case a.out <- wsFrame{kind: framePing}:
		return nil
	case <-a.done:
		return websocket.ErrCloseSent
	default:
		a.Close()
		return websocket.ErrCloseSent
	}
}

// Close：入队 close 帧并结束
func (a *wsConnAdapter) Close() error {
	a.closeOnce.Do(func() {
		// 优先尝试入队关闭帧
		select {
		case a.out <- wsFrame{kind: frameClose}:
		default:
		}
		// 发出关闭信号，随后关闭队列
		close(a.done)
		close(a.out)
	})
	return nil
}
