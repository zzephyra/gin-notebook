package metricsRoute

import (
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/service/metricsService"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetGitHubRepoMetricsApi(c *gin.Context) {
	responseCode, data := metricsService.GetGitHubRepoMetrics(c)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
