package metricsRoute

import (
	"github.com/gin-gonic/gin"
)

func RegisterMetricsRoutes(r *gin.RouterGroup) {
	repoGroup := r.Group("/metrics")

	{
		repoGroup.GET("/github", GetGitHubRepoMetricsApi)
	}
}
