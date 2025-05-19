package settingsRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterSettingsRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/settings")
	authGroup.Use(middleware.JWTAuth())
	authGroup.Use(middleware.RBACMiddleware())
	{
		authGroup.POST("/system", updateSystemSettings)
		authGroup.GET("", getSettings)
	}
}
