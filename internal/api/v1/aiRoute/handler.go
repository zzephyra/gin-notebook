package aiRoute

import (
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/aiService"
	"gin-notebook/pkg/logger"
	"net/http"

	"github.com/gin-gonic/gin"
)

func aiChatApi(c *gin.Context) {
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
