package uploadRoute

import (
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/service/uploadService"
	"net/http"

	"github.com/gin-gonic/gin"
)

func uploadPolicyApi(c *gin.Context) {
	responseCode, data := uploadService.GetUploadPolicy()
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
