package noteRoute

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/noteService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/validator"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func FavoriteNoteApi(c *gin.Context) {
	params := &dto.FavoriteNoteDTO{
		UserID: c.MustGet("userID").(int64),
	}
	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	responseCode, data := noteService.SetFavoriteNote(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func GetFavoriteNoteApi(c *gin.Context) {
	params := &dto.FavoriteNoteQueryDTO{
		UserID:  c.MustGet("userID").(int64),
		Offset:  0,
		Limit:   10,
		OrderBy: "title",
		Order:   "desc",
	}

	if err := c.ShouldBindQuery(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := noteService.GetFavoriteNoteList(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}
