package userRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/userService"
	"gin-notebook/pkg/utils/tools"
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
	selfID := c.MustGet("userID").(int64)
	roles := c.MustGet("role").([]string)

	isAdmin := tools.Contains(roles, "admin")

	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	fmt.Println("id", id, "selfID", selfID)
	if !isAdmin && selfID != id { // 非管理员且不是自己, 不能修改其他用户信息
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_USER_NO_RIGHT, nil))
		return
	}

	params := &dto.UserUpdateDTO{}
	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(400, nil))
		return
	}

	params.ID = id

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_USER_VALIDATE, nil))
		return
	}

	responseCode, data := userService.UpdateUserInfo(params)
	if data != nil {
		data = UserBriefSerializer(c, data.(*model.User))
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
