package validator

import (
	"fmt"
	"gin-notebook/pkg/logger"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

// ValidateStruct 通用结构体验证器
func ValidateStruct[T any](data *T) error {
	err := validate.Struct(data)
	if err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, ve := range validationErrors {
				logger.LogError(fmt.Errorf("validation error: %s", ve), "验证失败")
			}
			return err
		}
		return err
	}
	return nil
}
