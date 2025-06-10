package noteRoute

import (
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.RouterGroup) {
	noteGroup := r.Group("/note")
	noteGroup.Use(middleware.JWTAuth())
	noteGroup.Use(middleware.RBACMiddleware())
	{
		noteGroup.POST("/favorite", FavoriteNoteApi)
		noteGroup.GET("/favorite", GetFavoriteNoteApi)
	}
}
