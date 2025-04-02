package auth

import "github.com/gin-gonic/gin"

func Login(c *gin.Context) {
	// 获取请求参数
	username := c.PostForm("username")
	// password := c.PostForm("password")

	// 这里可以添加验证逻辑，比如查询数据库等

	// 返回响应
	c.JSON(200, gin.H{
		"message":  "login successful",
		"username": username,
	})
}

func SendRegisterCaptcha(ctx *gin.Context) {
	// 这里是发送验证码的逻辑
	ctx.JSON(200, gin.H{
		"message": "验证码已发送",
	})
}
