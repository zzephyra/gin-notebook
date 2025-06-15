package userRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/geoip"
	"gin-notebook/internal/service/userService"
	"gin-notebook/pkg/utils/tools"
	"gin-notebook/pkg/utils/validator"
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

func GetUserInfoApi(c *gin.Context) {
	userID := c.Param("id")
	selfID := c.MustGet("userID").(int64)
	roles := c.MustGet("role").([]string)

	isAdmin := tools.Contains(roles, "admin")

	id, err := strconv.ParseInt(userID, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := userService.GetUserInfo(id)
	fmt.Println("responseCode:", responseCode, "data:", data)
	if data != nil {
		if !isAdmin && selfID != id { // 非管理员且不是自己, 不能查看其他用户信息
			data = UserPublicDataSerializer(c, data.(*model.User))
		} else {
			data = UserBriefSerializer(c, data.(*model.User))
		}
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UserDeviceApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.UserDeviceCreateDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(400, nil))
		return
	}

	ipLookup, err := geoip.Lookup(c.ClientIP())
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_USER_VALIDATE, nil))
	}
	params.IP = c.ClientIP()
	params.Location = ipLookup
	params.UserID = userID

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_USER_VALIDATE, nil))
	}
	responseCode, data := userService.CreateUserDevice(params)

	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UserDeviceListApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.UserDeviceListDTO{}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(400, nil))
		return
	}

	params.UserID = userID

	if params.Limit == 0 {
		params.Limit = 5
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_USER_VALIDATE, nil))
	}
	responseCode, data := userService.GetUserDeviceList(params)

	if data != nil {
		data["devices"] = UserDeviceSerializer(c, data["devices"].(*[]model.UserDevice))
	}

	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
