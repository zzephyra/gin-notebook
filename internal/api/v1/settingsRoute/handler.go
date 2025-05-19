package settingsRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/settingsService"
	validator "gin-notebook/pkg/utils/validatior"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func updateSystemSettings(c *gin.Context) {
	params := &dto.UpdateSystemSettingsDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
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
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.Roles = roles

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := settingsService.GetSystemSettings(params)
	fmt.Println("data", data)
	SettingsSerializer(&data)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
