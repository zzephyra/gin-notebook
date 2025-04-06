package token

import (
	"gin-notebook/configs"
	"net/http"

	"github.com/gin-gonic/gin"
)

func StorageTokenInCookie(c *gin.Context, token string, name string, maxAge int, path string, domain string) {
	sameSite := http.SameSiteNoneMode
	if configs.Configs.Server.Https {
		sameSite = http.SameSiteNoneMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     name,
		Value:    token,
		MaxAge:   3600,
		Path:     path,
		Domain:   domain,
		Secure:   configs.Configs.Server.Https,
		HttpOnly: true,
		SameSite: sameSite,
	})
}
