package userRoute

import (
	"gin-notebook/internal/model"

	"github.com/gin-gonic/gin"
)

type UserAccountDTO struct {
	Nickname *string  `json:"nickname" gorm:";default:NULL"`
	Email    string   `json:"email" gorm:"unique;not null"`
	Role     []string `json:"role" gorm:"not null"`
	Phone    string   `json:"phone" gorm:"unique;default:NULL"`
	Avatar   string   `json:"avatar" gorm:"default:NULL"`
}

func UserBriefSerializer(c *gin.Context, user *model.User) UserAccountDTO {
	return UserAccountDTO{
		Nickname: user.Nickname,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     c.MustGet("role").([]string),
		Avatar:   user.Avatar,
	}
}
