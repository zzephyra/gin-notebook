package settingsRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterSettingsRoutes(r *gin.RouterGroup) {
	settingsGroup := r.Group("/settings")
	settingsGroup.Use(middleware.JWTAuth())
	settingsGroup.GET("", middleware.RBACMiddleware(middleware.AllowRoles(middleware.RoleUser, middleware.RoleAdmin)), getSettings)

	settingsGroup.Use(middleware.RBACMiddleware(middleware.OnlyAdmin))
	{
		settingsGroup.POST("/system", updateSystemSettings)
		// settingsGroup.GET("", getSettings)
		settingsGroup.POST("/ai/prompt", CreateAIChatPromptApi)
		settingsGroup.GET("/ai/prompts", GetAIChatPromptsApi)
		settingsGroup.DELETE("/ai/prompt", DeleteAIChatPromptsApi)
		settingsGroup.PUT("/ai/prompt", UpdateAIChatPromptApi)
	}
}
