package user

import (
	"gin-notebook/internal/model"

	"github.com/gin-gonic/gin"
)

type UserAccount struct {
	Nickname *string  `json:"nickname" gorm:";default:NULL"`
	Email    string   `json:"email" gorm:"unique;not null"`
	Role     []string `json:"role" gorm:"not null"`
	Phone    string   `json:"phone" gorm:"unique;default:NULL"`
}

func UserBriefSerializer(c *gin.Context, user *model.User) UserAccount {
	return UserAccount{
		Nickname: user.Nickname,
		Email:    user.Email,
		Phone:    user.Phone,
		Role:     c.MustGet("role").([]string),
	}
}
