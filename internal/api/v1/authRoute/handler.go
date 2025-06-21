package authRoute

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/authService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/token"
	"gin-notebook/pkg/utils/validator"
	"net/http"

	"github.com/gin-gonic/gin"
)

func LoginAuthApi(c *gin.Context) {
	var params = &dto.UserLoginDTO{}
	if err := c.ShouldBindJSON(params); err != nil {
		logger.LogError(err, "参数绑定失败：")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	logger.LogInfo("登录参数：", map[string]interface{}{
		"email":    params.Email,
		"password": params.Password,
	})
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	responseCode, accessToken := authService.UserLogin(params)

	token.StorageTokenInCookie(c, accessToken, "access_token", 3600*24, "/", "")
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func QQLoginApi(c *gin.Context) {}
