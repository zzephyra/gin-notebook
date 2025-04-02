package auth

import (
	"gin-notebook/internal/service/auth"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", func(ctx *gin.Context) {
			ctx.JSON(200, gin.H{
				"message": "login",
			})
		})
		authGroup.POST("/captchas", auth.SendRegisterCaptcha)
	}
}
