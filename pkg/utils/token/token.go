package token

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CookieOpts struct {
	Name, Value, Path, Domain string
	MaxAge                    int
	HTTPS                     bool
	CrossSite                 bool // 是否跨站/第三方上下文
	UsePartitioned            bool // 需要 CHIPS 时开启（Chrome/Edge）
	HttpOnly                  bool
}

func StorageTokenInCookie(c *gin.Context, token string, o CookieOpts) {
	if o.Name == "" {
		o.Name = "access_token"
	}
	if o.Path == "" {
		o.Path = "/"
	}
	if o.MaxAge <= 0 {
		o.MaxAge = 3600
	}
	if o.HttpOnly == false {
		o.HttpOnly = true
	}

	sameSite := http.SameSiteLaxMode
	if o.CrossSite {
		// 跨站必须 None + Secure
		if !o.HTTPS {
			c.String(http.StatusPreconditionFailed, "Cross-site cookies require HTTPS")
			return
		}
		sameSite = http.SameSiteNoneMode
	}

	ck := &http.Cookie{
		Name:     o.Name,
		Value:    token,
		Path:     o.Path,
		Domain:   o.Domain, // 仅必要时设置，localhost/IP请勿设置
		MaxAge:   o.MaxAge,
		Expires:  time.Now().Add(time.Duration(o.MaxAge) * time.Second),
		Secure:   o.HTTPS,
		HttpOnly: o.HttpOnly,
		SameSite: sameSite,
	}

	if o.UsePartitioned {
		// Go 目前没有字段，只能手动拼接
		c.Writer.Header().Add("Set-Cookie", ck.String()+"; Partitioned")
	} else {
		http.SetCookie(c.Writer, ck)
	}
}
