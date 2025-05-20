package userRoute

import (
	"gin-notebook/internal/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserAccountDTO struct {
	Nickname *string  `json:"nickname"`
	Email    string   `json:"email"`
	Role     []string `json:"role"`
	Phone    string   `json:"phone"`
	Avatar   string   `json:"avatar"`
	ID       string   `json:"id"`
}

func UserBriefSerializer(c *gin.Context, user *model.User) UserAccountDTO {
	return UserAccountDTO{
		Nickname: user.Nickname,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     c.MustGet("role").([]string),
		Avatar:   user.Avatar,
		ID:       strconv.FormatInt(user.ID, 10),
	}
}
