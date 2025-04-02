package api

import (
	v1 "gin-notebook/internal/api/v1"
	"gin-notebook/internal/http/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetRouter() *gin.Engine {
	r := gin.Default()
	r.Use(cors.Default())
	g := r.Group("/api")
	g.Use(middleware.Cors())
	v1.RegisterV1Routes(g)
	return r
}
