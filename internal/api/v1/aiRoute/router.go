package aiRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	aiGroup := r.Group("/ai")
	aiGroup.Use(middleware.JWTAuth())
	aiGroup.Use(middleware.RBACMiddleware())
	{
		aiGroup.POST("/chat", AIChatApi)
		aiGroup.POST("/message", AIMessageApi)
		aiGroup.GET("/history", AIHostoryChatApi)
		aiGroup.DELETE("/session/:id", DeleteAISessionChatApi)
		aiGroup.PUT("/session/:id", UpdateAISessionChatApi)
		aiGroup.GET("/session/:id", GetAISessionChatApi)
		aiGroup.PUT("/message/:id", UpdateAIMessageApi)
	}
}
