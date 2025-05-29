package validator

import (
	"gin-notebook/pkg/logger"
	"regexp"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// 用于创建自定义验证器的函数

func RegisterValidator() {
	// 注册自定义验证器
	v, ok := binding.Validator.Engine().(*validator.Validate)
	if ok {
		logger.LogInfo("validator engine", map[string]interface{}{
			"engine": v,
		})
		_ = v.RegisterValidation("notpunct", noPunctuation)
	} else {
		panic("validator engine not found")
	}
}

var punctuationRegex = regexp.MustCompile(`[!"#$%&'()*+,\-./:;<=>?@[\\\]^_{|}~]`)

func noPunctuation(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	logger.LogInfo("value", map[string]interface{}{
		"value": punctuationRegex.MatchString(value),
	})
	return !punctuationRegex.MatchString(value)
}
