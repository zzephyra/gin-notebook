package integrationRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func IntegrationRoutes(r *gin.RouterGroup) {
	integrationGroup := r.Group("/integration")
	integrationGroup.Use(middleware.JWTAuth())
	integrationGroup.Use(middleware.RBACMiddleware())
	// integrationGroup.Use(middleware.RequireWorkspaceAccess())
	{
		integrationGroup.POST("/app", CreateIntegrationAppApi)
		integrationGroup.GET("/app", GetIntegrationAppListApi)
		integrationGroup.GET("/feishu/callback", FeishuOAuthCallbackApi)
		integrationGroup.GET("/accounts", GetIntegrationAccountListApi)
		integrationGroup.DELETE("/account", UnlinkIntegrationAccountApi)
	}
}
