package realtimeRoute

import (
	"gin-notebook/internal/pkg/realtime/bus"
	"net/http"
	"slices"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// TopicAuthorizer 允许你插入权限校验（可选）
type TopicAuthorizer interface {
	Allow(c *gin.Context, topic string) bool
}

// AllowAll 默认放行
type AllowAll struct{}

func (AllowAll) Allow(_ *gin.Context, _ string) bool { return true }

type Handler struct {
	Broker           *bus.Broker
	Heartbeat        time.Duration
	MaxTopicsPerConn int
	Authorizer       TopicAuthorizer
}

func New(b *bus.Broker) *Handler {
	return &Handler{
		Broker:           b,
		Heartbeat:        15 * time.Second,
		MaxTopicsPerConn: 32, // 合理限制，防止滥用
		Authorizer:       AllowAll{},
	}
}

func (h *Handler) Serve(c *gin.Context) {
	topics := h.collectTopics(c)
	if len(topics) == 0 {
		c.String(http.StatusBadRequest, "no topics")
		return
	}
	if len(topics) > h.MaxTopicsPerConn {
		c.String(http.StatusBadRequest, "too many topics (max=%d)", h.MaxTopicsPerConn)
		return
	}

	// 鉴权（可替换为你的 RBAC）
	filtered := make([]string, 0, len(topics))
	for _, t := range topics {
		if h.Authorizer == nil || h.Authorizer.Allow(c, t) {
			filtered = append(filtered, t)
		}
	}
	if len(filtered) == 0 {
		c.Status(http.StatusForbidden)
		return
	}

	w := c.Writer
	flusher, ok := w.(http.Flusher)
	if !ok {
		c.Status(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 告知客户端已订阅的 topics（SSE 注释帧）
	_, _ = w.Write([]byte(": subscribed " + strings.Join(filtered, ",") + "\n\n"))
	flusher.Flush()

	ctx := c.Request.Context()

	// 为每个 topic 建立订阅，并扇入到一个 out 通道
	type sub struct {
		topic string
		ch    <-chan bus.Event
		unsub func()
	}
	subs := make([]sub, 0, len(filtered))
	for _, t := range filtered {
		ch, unsub := h.Broker.Subscribe(t)
		subs = append(subs, sub{topic: t, ch: ch, unsub: unsub})
	}
	defer func() {
		for _, s := range subs {
			s.unsub()
		}
	}()

	out := make(chan bus.Event, 64)
	var wg sync.WaitGroup
	wg.Add(len(subs))
	for _, s := range subs {
		s := s
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case evt, ok := <-s.ch:
					if !ok {
						return
					}
					select {
					case out <- evt:
					default:
						// 如果 out 满了，可选择丢弃或阻塞；这里选择丢弃（避免阻塞）
					}
				}
			}
		}()
	}

	// 连接退出时关闭 out
	go func() {
		wg.Wait()
		close(out)
	}()

	tick := time.NewTicker(h.Heartbeat)
	defer tick.Stop()

	// 主循环：事件 & 心跳
	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-out:
			if !ok {
				return
			}
			_, _ = w.Write(evt.Marshal())
			flusher.Flush()
		case <-tick.C:
			_, _ = w.Write([]byte(": ping\n\n"))
			flusher.Flush()
		}
	}
}

// —— 辅助：从 URL 构建多 Topic ——
//
// 支持：
//   - topic=ws:1&topic=proj:9&topic=user:42
//   - topics=ws:1,proj:9,user:42
//   - ws=1,2&proj=9,10（会自动拓展为 ws:1 / ws:2 / proj:9 / proj:10）
//   - workspace_id=1&project_id=9（保持兼容，也会补充 ws:1 / proj:9 / ws:1:proj:9）
func (h *Handler) collectTopics(c *gin.Context) []string {
	set := map[string]struct{}{}

	// 1) 直接的 topic（可多次）
	for _, t := range c.QueryArray("topic") {
		t = strings.TrimSpace(t)
		if t != "" {
			set[t] = struct{}{}
		}
	}

	// 2) topics= 逗号分隔
	for _, ts := range c.QueryArray("topics") {
		for _, t := range strings.Split(ts, ",") {
			t = strings.TrimSpace(t)
			if t != "" {
				set[t] = struct{}{}
			}
		}
	}

	// 3) 简写：ws=1,2  proj=9,10
	for _, ws := range splitCSV(c.Query("ws")) {
		set[bus.TopicWorkspace(ws)] = struct{}{}
	}
	for _, pj := range splitCSV(c.Query("proj")) {
		set[bus.TopicProject(pj)] = struct{}{}
	}

	// 4) 兼容旧参数：workspace_id / project_id
	wsID := strings.TrimSpace(c.Query("workspace_id"))
	pjID := strings.TrimSpace(c.Query("project_id"))
	if wsID != "" {
		set[bus.TopicWorkspace(wsID)] = struct{}{}
	}
	if pjID != "" {
		set[bus.TopicProject(pjID)] = struct{}{}
	}
	if wsID != "" || pjID != "" {
		set[bus.TopicWorkspaceProject(wsID, pjID)] = struct{}{}
	}

	// 去重 + 排序（稳定输出，便于测试）
	out := make([]string, 0, len(set))
	for t := range set {
		out = append(out, t)
	}
	slices.Sort(out)
	return out
}

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}
