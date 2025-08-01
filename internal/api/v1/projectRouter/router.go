package projectRouter

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func ProjectRoutes(r *gin.RouterGroup) {
	projectGroup := r.Group("/project")
	projectGroup.Use(middleware.JWTAuth())
	projectGroup.Use(middleware.RBACMiddleware())
	projectGroup.Use(middleware.RequireWorkspaceAccess())
	{
		projectGroup.GET("", GetProjectListApi)
		projectGroup.GET("/:projectID", GetProjectApi)
		projectGroup.POST("/task", CreateProjectTaskApi)
	}
}
