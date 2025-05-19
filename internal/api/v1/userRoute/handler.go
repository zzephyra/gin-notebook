package userRoute

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/userService"
	validator "gin-notebook/pkg/utils/validatior"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func UserInfoApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	responseCode, data := userService.GetUserInfo(userID)
	if data != nil {
		data = UserBriefSerializer(c, data.(*model.User))
	}
	c.JSON(200, response.Response(responseCode, data))
}

func UpdateUserInfoApi(c *gin.Context) {
	userID := c.Param("id")
	params := &dto.UserUpdateDTO{}
	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(200, response.Response(400, nil))
		return
	}

	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, response.Response(400, "invalid user id"))
		return
	}

	params.ID = id

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := userService.UpdateUserInfo(params)
	if data != nil {
		data = UserBriefSerializer(c, data.(*model.User))
	}
	c.JSON(200, response.Response(responseCode, data))
}
