package v1

import (
	"gin-notebook/internal/api/v1/auth"

	"github.com/gin-gonic/gin"
)

func RegisterV1Routes(r *gin.RouterGroup) {
	group := r.Group("/v1")
	// group.Use(middleware.JWTAuth("123"))
	auth.RegisterAuthRoutes(group)
}
