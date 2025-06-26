package eventRoute

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/eventService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/validator"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateEventApi(c *gin.Context) {
	params := &dto.CreateEventParamsDTO{
		UserID: c.MustGet("userID").(int64),
	}
	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	responseCode, data := eventService.CreateEvent(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func GetEventsListApi(c *gin.Context) {
	params := &dto.GetEventListParamsDTO{
		UserID: c.MustGet("userID").(int64),
	}
	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	responseCode, data := eventService.GetEventsList(params)
	if responseCode == message.SUCCESS {
		c.JSON(http.StatusOK, response.Response(responseCode, EventsListSerializer(*data)))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UpdateEventApi(c *gin.Context) {
	eventID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || eventID <= 0 {
		logger.LogError(err, "UpdateEventApi: invalid event ID")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	params := &dto.UpdateEventParamsDTO{
		UserID: c.MustGet("userID").(int64),
		ID:     eventID,
	}
	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	responseCode := eventService.UpdateEvent(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}
