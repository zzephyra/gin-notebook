package middleware

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/rbac"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RBACMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role") // 获取当前登陆用户角色
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, response.Response(message.ERROR_FORBIDDEN, nil))
			return
		}
		roles, ok := role.([]string) // 断言角色为字符串切片
		if !ok {
			c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_FORBIDDEN, nil))
			c.Abort()
			return
		}
		obj := c.Request.URL.Path
		act := c.Request.Method
		authorized := false
		for _, role := range roles {
			ok, err := rbac.Enforcer.Enforce(role, obj, act)
			if err != nil {
				c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INTERNAL_SERVER, nil))
				c.Abort()
				return
			}
			if ok {
				authorized = true
				break
			}
		}

		if !authorized {
			c.JSON(http.StatusForbidden, response.Response(message.ERROR_FORBIDDEN, nil))
			c.Abort()
			return
		}
		c.Next()
	}
}
