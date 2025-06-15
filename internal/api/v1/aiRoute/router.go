package aiRoute

import (
	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	aiGroup := r.Group("/ai")
	{
		aiGroup.POST("/chat", aiChatApi)
	}
}
