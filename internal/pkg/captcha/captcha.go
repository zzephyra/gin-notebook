package captcha

import (
	"fmt"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/email"
	"gin-notebook/pkg/templates"
	"gin-notebook/pkg/utils"
)

func SendRegisterCaptcha(to string) error {
	code := utils.RandomCaptcha()

	msg, err := templates.GenerateCaptchasEmail(to, code)

	if err != nil {
		return fmt.Errorf("failed to generate email")
	}

	err = cache.RedisInstance.SetCaptcha(to, code)

	if err != nil {
		return fmt.Errorf("failed to save captcha into redis")
	}

	if err := email.SendEmail(to, "验证码", msg); err != nil {
		return fmt.Errorf("failed to send email")
	}
	return nil
}

func ValidateCaptcha(to, code string) error {
	captcha, err := cache.RedisInstance.GetCaptcha(to)
	if err != nil {
		return fmt.Errorf("verification code error")
	}
	if captcha != code {
		return fmt.Errorf("captcha is not correct")
	}
	return nil
}
