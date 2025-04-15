package user

import (
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/service/user"

	"github.com/gin-gonic/gin"
)

func UserInfoApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	responseCode, data := user.GetUserInfo(userID)
	if data != nil {
		data = UserBriefSerializer(c, data.(*model.User))
	}
	c.JSON(200, response.Response(responseCode, data))
}
