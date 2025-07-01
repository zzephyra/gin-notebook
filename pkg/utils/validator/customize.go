package validator

import (
	"fmt"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/logger"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/teambition/rrule-go"
)

// 用于创建自定义验证器的函数
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

func RegisterValidator() {
	// 注册自定义验证器
	validate.RegisterValidation("rrule", RruleValidator)
	validate.RegisterValidation("notpunct", noPunctuation)
	validate.RegisterValidation("duration", DurationValidator)

}

var punctuationRegex = regexp.MustCompile(`[!"#$%&'()*+,\-./:;<=>?@[\\\]^_{|}~]`)

func noPunctuation(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	logger.LogInfo("value", map[string]interface{}{
		"value": punctuationRegex.MatchString(value),
	})
	return !punctuationRegex.MatchString(value)
}

func RruleValidator(fl validator.FieldLevel) bool {
	rule := fl.Field().String()
	fmt.Println("RruleValidator rule:", rule)
	_, err := rrule.StrToRRule(rule)
	if err != nil {
		logger.LogError(err, "RruleValidator error")
		return false
	}
	return err == nil
}

func DurationValidator(fl validator.FieldLevel) bool {
	duration, ok := fl.Field().Interface().(dto.Duration)
	if !ok {
		return false // 类型不匹配
	}
	return duration.Hours > 0 || duration.Minutes > 0
}
