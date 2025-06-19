package aiRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/aiService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/validator"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func AIChatApi(c *gin.Context) {
	req := dto.AIRequestDTO{}
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.LogError(err, "aiChatApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	upRes, err := aiService.GetAIChatResponse(c.Request.Context(), &req)
	if err != nil {
		c.Writer.Write([]byte("data: " + "upstream failed\n\n"))
		c.Writer.Flush()
		return
	}
	defer upRes.Body.Close()

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Status(upRes.StatusCode)
	if f, ok := c.Writer.(http.Flusher); ok {
		f.Flush()
	}

	flusher, _ := c.Writer.(http.Flusher)
	buf := make([]byte, 32*1024)
	for {
		n, err := upRes.Body.Read(buf)
		if n > 0 {
			if _, wErr := c.Writer.Write(buf[:n]); wErr != nil {
				logger.LogError(wErr, "aiChatApi: failed to write to response")
				break
			}
			flusher.Flush()
		}
		if err != nil {
			logger.LogError(err, "upstream read error:")
			break
		}
	}
}

func AIMessageApi(c *gin.Context) {
	params := &dto.AIMessageParamsDTO{}
	if err := c.ShouldBindJSON(params); err != nil {
		logger.LogError(err, "CreateAISessionApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	params.UserID = c.MustGet("userID").(int64)

	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	ctx := c.Request.Context()
	responseCode, data := aiService.AIMessage(ctx, params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func AIHostoryChatApi(c *gin.Context) {
	params := &dto.AIHistoryChatParamsDTO{}
	if err := c.ShouldBindQuery(params); err != nil {
		logger.LogError(err, "AIHostoryChatApi: failed to bind query")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid query"})
		return
	}

	params.UserID = c.MustGet("userID").(int64)

	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := aiService.GetAIHistoryChat(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func DeleteAISessionChatApi(c *gin.Context) {
	params := &dto.AIHistoryDeleteParamsDTO{
		SessionID: c.Param("id"),
		UserID:    c.MustGet("userID").(int64),
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode := aiService.DeleteAIHostoryChat(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func UpdateAISessionChatApi(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		fmt.Println("转换失败:", err)
		return
	}

	params := &dto.AIHistoryUpdateParamsDTO{
		SessionID: sessionID,
		UserID:    c.MustGet("userID").(int64),
	}
	if err := c.ShouldBindJSON(params); err != nil {
		logger.LogError(err, "UpdateAISessionChatApi: failed to bind JSON")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	fmt.Println("UpdateAISessionChatApi params:", params)

	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode := aiService.UpdateAISessionChat(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func GetAISessionChatApi(c *gin.Context) {
	sessionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		fmt.Println("转换失败:", err)
		return
	}

	params := &dto.AISessionParamsDTO{
		SessionID: sessionID,
		UserID:    c.MustGet("userID").(int64),
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := aiService.GetAISession(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
