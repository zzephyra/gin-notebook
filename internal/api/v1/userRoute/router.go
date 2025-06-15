package userRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/user")
	authGroup.Use(middleware.JWTAuth())
	authGroup.Use(middleware.RBACMiddleware())
	{
		authGroup.GET("/info", UserInfoApi)
		authGroup.GET("/info/:id", GetUserInfoApi)
		authGroup.POST("/info/:id", UpdateUserInfoApi)
		authGroup.POST("/device", UserDeviceApi)
		authGroup.GET("/device", UserDeviceListApi)
	}
}
