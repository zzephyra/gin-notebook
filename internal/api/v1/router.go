package v1

import (
	"gin-notebook/internal/api/v1/authRoute"
	"gin-notebook/internal/api/v1/settingsRoute"
	"gin-notebook/internal/api/v1/uploadRoute"
	"gin-notebook/internal/api/v1/userRoute"
	"gin-notebook/internal/api/v1/workspaceRoute"

	"github.com/gin-gonic/gin"
)

func RegisterV1Routes(r *gin.RouterGroup) {
	group := r.Group("/v1")
	authRoute.RegisterAuthRoutes(group)
	userRoute.RegisterUserRoutes(group)
	workspaceRoute.RegisterUserRoutes(group)
	settingsRoute.RegisterSettingsRoutes(group)
	uploadRoute.RegisterSettingsRoutes(group)
}
