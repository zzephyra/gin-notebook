package aiRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAiRoutes(r *gin.RouterGroup) {
	aiGroup := r.Group("/ai")
	aiGroup.Use(middleware.JWTAuth())
	aiGroup.Use(middleware.RBACMiddleware())
	aiGroup.Use(middleware.RequireWorkspaceAccess())
	{
		aiGroup.POST("/chat", AIChatApi)
		aiGroup.POST("/message", AIMessageApi)
		aiGroup.GET("/history", AIHostoryChatApi)
		aiGroup.DELETE("/session/:id", DeleteAISessionChatApi)
		aiGroup.PUT("/session/:id", UpdateAISessionChatApi)
		aiGroup.GET("/session/:id", GetAISessionChatApi)
		aiGroup.PUT("/message/:id", UpdateAIMessageApi)
		aiGroup.GET("/action", GetAIChatActionsApi)
	}
}
