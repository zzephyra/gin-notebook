// internal/middleware/localization.go
package middleware

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/text/language"

	appi18n "gin-notebook/internal/i18n"
	"gin-notebook/internal/locale"
)

func Localization(getUserLocale func(*gin.Context) string, defaultTag language.Tag) gin.HandlerFunc {
	return func(c *gin.Context) {
		userPref := ""
		if getUserLocale != nil {
			userPref = getUserLocale(c)
		}
		lc := locale.Resolve(locale.Sources{
			XLanguage:      c.GetHeader("X-Language"),
			AcceptLanguage: c.GetHeader("Accept-Language"),
			UserPreference: userPref,
			DefaultTag:     defaultTag,
		})

		loc := appi18n.NewLocalizer(lc, defaultTag.String())

		// 写入 gin 上下文与 request.Context（service 可用）
		c.Set("locale", lc)
		c.Set("localizer", loc)
		c.Request = c.Request.WithContext(locale.WithLocale(c.Request.Context(), lc))
		c.Request = c.Request.WithContext(locale.WithLocalizer(c.Request.Context(), loc))

		c.Next()
	}
}
