package api

import (
	v1 "gin-notebook/internal/api/v1"
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

func SetRouter() *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.AuditMeta())
	g := r.Group("/api")
	v1.RegisterV1Routes(g)
	return r
}
