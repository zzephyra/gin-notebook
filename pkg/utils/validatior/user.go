package validator

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/captcha"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
	"strconv"
)

func ValidateNewUser(data dto.CreateUserValidation) (int, error) {

	if data.Email == "" || data.Password == "" {
		return message.ERROR_EMAIL_OR_PASSWORD, fmt.Errorf("email or password is empty")
	}

	if len(data.Password) < 6 {
		return message.ERROR_PASSWORD_LENGTH_INVALID, fmt.Errorf("password length is invalid")
	}

	if err := captcha.ValidateCaptcha(data.Email, data.Code); err != nil {
		return message.ERROR_VALIDATE_CODE_INVALID, err
	}

	return 200, nil
}

func ValidateUserLogin(data dto.UserLoginValidation) (map[string]interface{}, error) {
	logger.LogInfo("ValidateNewUser", map[string]interface{}{
		"email":    data.Email,
		"password": data.Password,
	})
	if data.Email == "" || data.Password == "" {
		return response.Response(message.ERROR_EMAIL_OR_PASSWORD, nil), fmt.Errorf("email or password is empty")
	}
	user, err := repository.GetUserByEmail(data.Email)
	if err != nil {
		return response.Response(message.ERROR_USER_NOT_EXIST, nil), fmt.Errorf("user not exist")
	}
	if is_equal := algorithm.VerifyPassword(data.Password, user.Password); !is_equal {
		return response.Response(message.ERROR_PASSWORD_INVALID, nil), fmt.Errorf("password is invalid")
	}
	roles, err := rbac.GetUserRole(strconv.FormatInt(user.ID, 10))
	if err != nil {
		return response.Response(message.ERROR_USER_NO_RIGHT, nil), fmt.Errorf("user no right")
	}

	return map[string]interface{}{
		"UserId": user.ID,
		"Role":   roles,
	}, nil
}
