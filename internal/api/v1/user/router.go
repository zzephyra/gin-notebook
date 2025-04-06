package user

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/user")
	authGroup.Use(middleware.JWTAuth())
	{
		authGroup.GET("/info", UserInfoApi)
	}
}
