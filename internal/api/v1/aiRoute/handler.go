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
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Flush()
	upRes, err := aiService.GetAIChatResponse(&req)
	if err != nil {
		c.Writer.Write([]byte("data: " + "upstream failed\n\n"))
		c.Writer.Flush()
		return
	}
	for k, v := range upRes.Header {
		for _, vi := range v {
			c.Writer.Header().Add(k, vi)
		}
	}
	c.Status(upRes.StatusCode)
	flusher, _ := c.Writer.(http.Flusher)
	buf := make([]byte, 32*1024)
	for {
		n, err := upRes.Body.Read(buf)
		if n > 0 {
			if _, wErr := c.Writer.Write(buf[:n]); wErr != nil {
				break
			}
			flusher.Flush()
		}
		if err != nil {
			break
		}
	}
}
