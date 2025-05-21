package userRoute

import (
	"encoding/json"
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

func UserDeviceSerializer(c *gin.Context, devices *[]model.UserDevice) []map[string]interface{} {
	lang := c.GetHeader("Accept-Language")
	if lang == "" {
		lang = "en"
	}

	var output []map[string]interface{}
	for _, device := range *devices {
		var (
			country = map[string]string{}
			city    = map[string]string{}
		)
		json.Unmarshal(device.Country, &country)
		json.Unmarshal(device.Country, &city)

		country_val, ok := country[lang]
		if !ok {
			country_val = country["en"]
		}

		city_val, ok := city[lang]
		if !ok {
			city_val = city["en"]
		}

		output = append(output, map[string]interface{}{
			"id":          strconv.FormatInt(device.ID, 10),
			"fingerprint": device.Fingerprint,
			"os":          device.Os,
			"device":      device.Device,
			"user_agent":  device.UserAgent,
			"ip":          device.IP,
			"country":     country_val,
			"city":        city_val,
			"updated_at":  device.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return output
}
