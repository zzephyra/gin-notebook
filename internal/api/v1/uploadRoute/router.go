package uploadRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterSettingsRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/upload")
	authGroup.Use(middleware.JWTAuth())
	authGroup.Use(middleware.RBACMiddleware())
	{
		authGroup.GET("/policy", uploadPolicyApi)
		// authGroup.GET("", getSettings)
	}
}
