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
		aiGroup.POST("/chat", aiChatApi)
	}
}
