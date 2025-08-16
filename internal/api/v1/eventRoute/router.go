package eventRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterEventRoutes(r *gin.RouterGroup) {
	evnetGroup := r.Group("/event")
	evnetGroup.Use(middleware.JWTAuth())
	evnetGroup.Use(middleware.RequireWorkspaceAccess())
	evnetGroup.Use(middleware.RBACMiddleware())
	{
		evnetGroup.POST("", CreateEventApi)
		evnetGroup.GET("", GetEventsListApi)
		evnetGroup.PUT("/:id", UpdateEventApi)
	}
}
