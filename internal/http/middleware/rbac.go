package middleware

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/pkg/utils/tools"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type RBACOptions struct {
	OnlyAdmin  bool
	AllowRoles map[Role]struct{}
}

type RBACOption func(*RBACOptions)

func OnlyAdmin(r *RBACOptions) { r.OnlyAdmin = true }
func AllowRoles(roles ...Role) RBACOption {
	return func(o *RBACOptions) {
		if o.AllowRoles == nil {
			o.AllowRoles = make(map[Role]struct{}, len(roles))
		}
		for _, r := range roles {
			o.AllowRoles[r] = struct{}{}
		}
	}
}

func RBACMiddleware(opts ...RBACOption) gin.HandlerFunc {
	options := &RBACOptions{}
	for _, o := range opts {
		o(options)
	}

	return func(c *gin.Context) {
		role, exists := c.Get("role") // 获取当前登陆用户角色
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response(message.ERROR_UNAUTHORIZED, nil))
			return
		}
		roles, ok := role.([]string) // 断言角色为字符串切片
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, response.Response(message.ERROR_UNAUTHORIZED, nil))
			return
		}
		obj := c.Request.URL.Path
		act := c.Request.Method

		if options.OnlyAdmin {
			if !tools.Contains(roles, string(RoleAdmin)) {
				c.AbortWithStatusJSON(http.StatusForbidden, response.Response(message.ERROR_FORBIDDEN, nil))
				return
			}
		}

		if len(options.AllowRoles) > 0 {
			allowed := false
			for _, r := range roles {
				if _, ok := options.AllowRoles[Role(r)]; ok {
					allowed = true
					break
				}
			}
			if !allowed {
				c.AbortWithStatusJSON(http.StatusForbidden, response.Response(message.ERROR_FORBIDDEN, nil))
				return
			}
		}

		authorized := false
		for _, role := range roles {
			ok, err := rbac.Enforcer.Enforce(role, obj, act)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusInternalServerError, response.Response(message.ERROR_INTERNAL_SERVER, nil))
				return
			}
			if ok {
				authorized = true
				break
			}
		}

		if !authorized {
			c.AbortWithStatusJSON(http.StatusForbidden, response.Response(message.ERROR_FORBIDDEN, nil))
			return
		}
		c.Next()
	}
}
