package authRoute

import (
	"gin-notebook/internal/service/auth"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", auth.UserLogin)
		authGroup.POST("/captchas", auth.SendRegisterCaptcha)
		authGroup.POST("/register", auth.UserRegister)
	}
}
