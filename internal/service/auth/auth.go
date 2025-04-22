package auth

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/captcha"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/token"
	validator "gin-notebook/pkg/utils/validatior"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UserLogin(c *gin.Context) {
	// 获取请求参数

	var u dto.UserLoginValidation
	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	// 验证用户登录信息
	data, err := validator.ValidateUserLogin(u)
	if err != nil {
		c.JSON(http.StatusBadRequest, data)
		return
	}
	roles, ok := data["Role"].([]string)
	if !ok {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_USER_NO_RIGHT, nil))
		return
	}
	accessToken, err := token.GenerateTokens(data["UserId"].(int64), roles, data["Nickname"].(*string), data["Email"].(string), data["Avatar"].(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_GENERATE_TOKEN, nil))
		return
	}
	token.StorageTokenInCookie(c, accessToken, "access_token", 3600*24, "/", "")

	// 返回响应
	c.JSON(200, response.Response(message.SUCCESS, nil))
}

func SendRegisterCaptcha(c *gin.Context) {
	// 这里是发送验证码的逻辑
	var r UserEmailVerificationRequest
	if err := c.ShouldBindJSON(&r); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	err := captcha.SendRegisterCaptcha(r.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_SEND_CAPTCHA, nil))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "验证码已发送",
	})
}

func UserRegister(c *gin.Context) {
	// 这里是用户注册的逻辑
	var user dto.CreateUserValidation
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	code, err := validator.ValidateNewUser(user)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(code, nil))
		return
	}
	// 这里可以添加注册逻辑，比如保存到数据库等
	err = repository.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_CREATE_USER, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(message.SUCCESS, nil))
}
