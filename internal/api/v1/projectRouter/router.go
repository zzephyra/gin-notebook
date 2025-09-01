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
		projectGroup.PUT("/task/:taskID", UpdateProjectTaskApi)
		projectGroup.POST("/task/:taskID/comment", CreateProjecttaskCommentsApi)
		projectGroup.DELETE("/column/:columnID", DeleteProjectColumnApi)
		projectGroup.PUT("/column/:columnID", UpdateProjectColumnApi)
		projectGroup.GET("/task/:taskID/comment", GetProjecttaskCommentsApi)
		projectGroup.DELETE("/task/:taskID/comment/:commentID", DeletetaskCommentsApi)
		projectGroup.PUT("/task/:taskID/comment/:commentID", UpdatetaskCommentsApi)
		projectGroup.POST("/task/:taskID/comment/:commentID/attachment", CreatetaskCommentAttachmentApi)
	}
}
