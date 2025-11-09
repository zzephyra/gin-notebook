package settingsRoute

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/aiService"
	"gin-notebook/internal/service/settingsService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/validator"
	"net/http"

	"github.com/gin-gonic/gin"
)

func updateSystemSettings(c *gin.Context) {
	params := &dto.UpdateSystemSettingsDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := settingsService.UpdateSystemSettings(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func getSettings(c *gin.Context) {
	roles := c.MustGet("role").([]string)
	params := &dto.GetSettingsDTO{}
	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.Roles = roles

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := settingsService.GetSystemSettings(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreateAIChatPromptApi(c *gin.Context) {
	params := dto.AIChatPromptCreateParamsDTO{}
	if err := c.ShouldBindJSON(&params); err != nil {
		logger.LogError(err, "CreateAIChatPromptApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if err := validator.ValidateStruct(&params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := aiService.CreateAIChatPrompt(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetAIChatPromptsApi(c *gin.Context) {
	responseCode, data := aiService.GetAIChatPrompts(c.Request.Context())
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func DeleteAIChatPromptsApi(c *gin.Context) {
	params := dto.DeleteAIChatPromptParamsDTO{}
	if err := c.ShouldBindJSON(&params); err != nil {
		logger.LogError(err, "CreateAIChatPromptApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(&params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode := aiService.DeleteAIChatPrompt(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func UpdateAIChatPromptApi(c *gin.Context) {
	params := dto.UpdateAIChatPromptParamsDTO{}
	if err := c.ShouldBindJSON(&params); err != nil {
		logger.LogError(err, "UpdateAIChatPromptApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(&params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode := aiService.UpdateAIPrompt(c.Request.Context(), &params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}
