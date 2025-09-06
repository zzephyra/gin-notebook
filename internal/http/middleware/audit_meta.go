package middleware

import (
	auditContext "gin-notebook/internal/context"
	"gin-notebook/pkg/utils/tools"

	"github.com/gin-gonic/gin"
)

func AuditMeta() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 这里按你的项目从 JWT / RBAC / Header / Params 提取
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			reqID = tools.GenerateBase64RequestID()
		}
		ip := c.ClientIP()
		ua := c.Request.UserAgent()

		meta := auditContext.Meta{
			RequestID: reqID,
			IP:        ip,
			UA:        ua,
		}

		// 把 meta 写回到标准 ctx
		c.Request = c.Request.WithContext(auditContext.IntoContext(c.Request.Context(), meta))
		c.Next()
	}
}
