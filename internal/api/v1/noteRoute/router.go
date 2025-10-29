package noteRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterNoteRoutes(r *gin.RouterGroup) {
	noteGroup := r.Group("/note")
	noteGroup.Use(middleware.JWTAuth())
	noteGroup.Use(middleware.RBACMiddleware())
	noteGroup.Use(middleware.RequireWorkspaceAccess())

	{
		noteGroup.POST("/favorite", FavoriteNoteApi)
		noteGroup.GET("/favorite", GetFavoriteNoteApi)
		noteGroup.POST("/comments", CreateNoteCommentApi)
		noteGroup.POST("/template", CreateTemplateNoteApi)
		noteGroup.GET("/templates", GetTemplateNotesApi)
		noteGroup.POST("/sync", AddNoteSyncApi)
		noteGroup.GET("/sync", GetNoteSyncListApi)
		noteGroup.DELETE("/sync", DeleteNoteSyncApi)
	}
}
