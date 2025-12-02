package middleware

import (
	"errors"
	"gin-notebook/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthCtx struct {
	UserID      int64
	WorkspaceID int64
}

type DBWithRLS struct{ DB *gorm.DB }

func (d *DBWithRLS) WithRLS() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从上游鉴权中间件或解析得到 auth
		auth := repository.AuthCtx{
			UserID:      c.GetInt64("userID"),
			WorkspaceID: c.GetInt64("workspace_id"),
		}

		// 只读优化：GET/HEAD 自动只读
		var opts []repository.TxOption
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" {
			opts = append(opts, repository.WithReadOnly())
		}

		tx, finish, err := repository.BeginWithRLS(c.Request.Context(), d.DB, auth, opts...)
		if err != nil {
			c.AbortWithStatus(500)
			return
		}

		// 将 tx 放进 Gin Context，后续 handler 统一从这里拿
		c.Set("db", tx)

		// 继续业务处理
		c.Next()

		// 根据是否中断/错误决定提交还是回滚
		if c.IsAborted() {
			finish(errors.New("aborted"))
			return
		}
		// 你也可以把 handler 的错误聚合在 c.Errors 中，这里传 nil 表示正常提交
		finish(nil)
	}
}
