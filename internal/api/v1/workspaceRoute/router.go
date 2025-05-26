package workspaceRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(r *gin.RouterGroup) {
	authGroup := r.Group("/workspace")
	authGroup.Use(middleware.JWTAuth())
	{
		authGroup.GET("/list", GetWorkspaceListApi)
		authGroup.POST("", CreateWorkspaceApi)
		authGroup.GET("", GetWorkspaceApi)
		authGroup.POST("/:id", UpdateWorkspaceApi)
		authGroup.GET("/:workspaceID/links", GetWorkspaceLinksListApi)
		authGroup.DELETE("/link/:id", DeleteWorkspaceLinkApi)
		authGroup.GET("/link/:linkUUID", GetWorkspaceLinkApi)
		authGroup.POST("/link/member/", CreateWorkspaceMemberByLinkApi)
		authGroup.POST("/link", CreateWorkspaceLinkApi)
		authGroup.GET("/notes/", GetWorkspaceNotesApi)
		authGroup.PUT("/notes/", UpdateWorkspaceNoteApi)
		authGroup.POST("/notes/", CreateWorkspaceNoteApi)
		authGroup.POST("/note/delete/", DeleteWorkspaceNoteApi)
		authGroup.GET("/notes/category/", GetWorkspaceNotesCategoryApi)
		authGroup.PUT("/notes/category/", UpdateWorkspaceCategoryApi)
		authGroup.POST("/notes/category/", CreateWorkspaceCategoryApi)
		authGroup.GET("/notes/category/:id/", GetWorkspaceNotesCategoryApi)
		authGroup.GET("/recommend/category/", GetRecommandNotesCategoryApi)
		// authGroup.GET("/upload/generate/token", GetUploadTokenApi)
	}
}
