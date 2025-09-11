package realtimeRoute

import (
	"time"

	"github.com/gin-gonic/gin"

	"gin-notebook/internal/http/middleware"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/realtime/bus"
	"gin-notebook/internal/service/realtimeService"
)

func RealTimeRoute(r *gin.RouterGroup, sseHandler *Handler) {
	realtimeGroup := r.Group("/realtime")
	realtimeGroup.Use(
		middleware.JWTAuth(),
		middleware.RequireWorkspaceAccess(),
		middleware.RBACMiddleware(),
	)

	// 保留原有 SSE
	realtimeGroup.GET("/sse", sseHandler.Serve)

	// —— 新增 WS：注入 RedisBus → 传给 realtimeService —— //
	evtBus := bus.DefaultWsPublisher()
	rtSvc := realtimeService.New(cache.RedisInstance.Client, 60*time.Second, evtBus) // ← 新签名：(rdb, ttl, pub, sub)

	wsHandler := NewWsHandler(rtSvc)
	realtimeGroup.GET("/ws", wsHandler.ServeWS)
}
