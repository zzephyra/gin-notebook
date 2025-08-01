package workspaceRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterWorkspaceRoutes(r *gin.RouterGroup) {
	workspaceGroup := r.Group("/workspace")
	workspaceGroup.Use(middleware.JWTAuth())
	{
		workspaceGroup.GET("/list", GetWorkspaceListApi)
		workspaceGroup.POST("", CreateWorkspaceApi)
		workspaceGroup.GET("", GetWorkspaceApi)
		workspaceGroup.POST("/:id", UpdateWorkspaceApi)
		workspaceGroup.GET("/:workspaceID/links", GetWorkspaceLinksListApi)
		workspaceGroup.DELETE("/link/:id", DeleteWorkspaceLinkApi)
		workspaceGroup.GET("/link/:linkUUID", GetWorkspaceLinkApi)
		workspaceGroup.POST("/link/member/", CreateWorkspaceMemberByLinkApi)
		workspaceGroup.POST("/link", CreateWorkspaceLinkApi)
		workspaceGroup.GET("/notes/", GetWorkspaceNotesApi)
		workspaceGroup.PUT("/notes/", UpdateWorkspaceNoteApi)
		workspaceGroup.POST("/notes/", CreateWorkspaceNoteApi)
		workspaceGroup.POST("/note/delete/", DeleteWorkspaceNoteApi)
		workspaceGroup.GET("/notes/category/", GetWorkspaceNotesCategoryApi)
		workspaceGroup.PUT("/notes/category/", UpdateWorkspaceCategoryApi)
		workspaceGroup.POST("/notes/category/", CreateWorkspaceCategoryApi)
		workspaceGroup.GET("/notes/category/:id/", GetWorkspaceNotesCategoryApi)
		workspaceGroup.GET("/recommend/category/", GetRecommandNotesCategoryApi)
		workspaceGroup.GET("/members", GetWorkspaceMembersApi)
		// workspaceGroup.GET("/upload/generate/token", GetUploadTokenApi)
	}
}
