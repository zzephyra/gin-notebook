package api

import (
	v1 "gin-notebook/internal/api/v1"
	"gin-notebook/internal/http/middleware"

	"github.com/gin-gonic/gin"
	"golang.org/x/text/language"
)

func SetRouter() *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.AuditMeta())

	getUserLocale := func(c *gin.Context) string {
		// 从用户信息中获取 locale, 暂时为空
		return ""
	}
	r.Use(middleware.Localization(getUserLocale, language.SimplifiedChinese))

	g := r.Group("/api")
	v1.RegisterV1Routes(g)
	return r
}
