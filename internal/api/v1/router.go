package v1

import (
	"gin-notebook/internal/api/v1/auth"
	"gin-notebook/internal/api/v1/user"
	"gin-notebook/internal/api/v1/workspace"

	"github.com/gin-gonic/gin"
)

func RegisterV1Routes(r *gin.RouterGroup) {
	group := r.Group("/v1")
	auth.RegisterAuthRoutes(group)
	user.RegisterUserRoutes(group)
	workspace.RegisterUserRoutes(group)

}
