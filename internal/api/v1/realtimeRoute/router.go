package realtimeRoute

import (
	"time"

	"gin-notebook/internal/http/middleware"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/service/realtimeService"

	"github.com/gin-gonic/gin"
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

	// 新增 WS：route → handler → service
	rtSvc := realtimeService.New(cache.RedisInstance.Client, 60*time.Second)
	wsHandler := NewWsHandler(rtSvc)
	realtimeGroup.GET("/ws", wsHandler.ServeWS)
}
