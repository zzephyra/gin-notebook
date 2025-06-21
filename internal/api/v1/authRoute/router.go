package authRoute

import (
	"gin-notebook/internal/service/authService"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", LoginAuthApi)
		authGroup.POST("/logout", authService.UserLogout)
		authGroup.POST("/captchas", authService.SendRegisterCaptcha)
		authGroup.POST("/register", authService.UserRegister)
		authGroup.POST("/qq-login", QQLoginApi)
	}
}
