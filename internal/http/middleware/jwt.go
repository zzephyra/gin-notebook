package middleware

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/pkg/utils/token"
	"net/http"

	"github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("access_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.Response(message.ERROR_TOKEN_EXIST, nil))
			c.Abort()
			return
		}

		userClaim, err := token.ParseToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.Response(message.ERROR_USER_NOT_EXIST, nil))
			c.Abort()
			return
		}
		// 将用户信息存储到上下文中
		c.Set("userID", userClaim.UserID)
		c.Set("role", userClaim.Role)
		c.Set("nickname", userClaim.Nickname)
		c.Set("email", userClaim.Email)
		c.Set("avatar", userClaim.Avatar)
		c.Next()
	}
}
