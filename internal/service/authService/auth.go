package authService

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/captcha"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/google"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/token"
	"gin-notebook/pkg/utils/validator"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func UserLogin(params *dto.UserLoginDTO) (responseCode int, data string) {
	// 获取请求参数
	var user *model.User
	var err error
	var channel = strings.ToLower(params.Channel)
	if channel == "email" {
		user, err = repository.GetUserByEmail(params.Email)
		if err != nil {
			responseCode = message.ERROR_USER_NOT_EXIST
			logger.LogError(err, "用户不存在")
			return
		}
	} else if channel == "google" {
		fmt.Println("Google login channel detected")
		googleUser, err := google.Google.OAuth2(params.GoogleToken)
		if err != nil {
			responseCode = message.ERROR_GOOGLE_OAUTH
			logger.LogError(err, "Google OAuth failed")
			return
		}

		user, err = repository.GetUserByEmail(googleUser.Email)
		if err != nil {
			userData := &dto.CreateUserDTO{
				Email:    googleUser.Email,
				Nickname: &googleUser.Name,
				Avatar:   &googleUser.Picture,
			}
			newGoogleUser, err := repository.CreateUser(*userData)
			if err != nil {
				responseCode = message.ERROR_CREATE_GOOGLE_USER
				return
			}
			user = newGoogleUser
		}
	} else {
		responseCode = message.ERROR_INVALID_CHANNEL
		logger.LogError(fmt.Errorf("invalid login channel: %s", channel), "登录渠道错误")
		return
	}

	roles, err := rbac.GetUserRole(strconv.FormatInt(user.ID, 10))

	if err != nil {
		responseCode = message.ERROR_USER_NO_RIGHT
		logger.LogError(err, "获取用户角色失败")
		return
	}

	accessToken, err := token.GenerateTokens(user.ID, roles, user.Nickname, user.Email, user.Avatar)
	if err != nil {
		responseCode = message.ERROR_GENERATE_TOKEN
		return
	}
	responseCode = message.SUCCESS
	data = accessToken
	// 返回响应
	return
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

	c.JSON(http.StatusOK, response.Response(message.SUCCESS, nil))
}

func UserRegister(c *gin.Context) {
	// 这里是用户注册的逻辑
	var user dto.CreateUserDTO
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	code, err := validator.ValidateNewUser(user)
	if err != nil {
		logger.LogError(err, "用户注册验证失败")
		c.JSON(http.StatusBadRequest, response.Response(code, nil))
		return
	}
	// 这里可以添加注册逻辑，比如保存到数据库等
	_, err = repository.CreateUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_CREATE_USER, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(message.SUCCESS, nil))
}

func UserLogout(c *gin.Context) {
	// 清除用户的登录状态
	// 这里可以根据实际情况清除用户的登录状态，比如清除cookie或session等
	c.SetCookie("access_token", "", -1, "/", "", false, true) // 清除cookie
	c.JSON(http.StatusOK, response.Response(message.SUCCESS, nil))
}
