package projectRouter

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/projectService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/validator"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateProjectTaskApi(c *gin.Context) {
	params := &dto.CreateProjectTaskDTO{
		Creator: c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for CreateProjectTaskDTO")
		return
	}

	responseCode, data := projectService.CreateProjectTask(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func GetProjectListApi(c *gin.Context) {
	params := &dto.ListProjectsDTO{
		UserID: c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		logger.LogError(err, "Failed to bind query parameters")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := projectService.GetWorkspaceProject(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func GetProjectApi(c *gin.Context) {
	projectID, isExist := c.Params.Get("projectID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	ProjectID, err := strconv.ParseInt(projectID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.GetProjectDTO{
		ProjectID: ProjectID,
		UserID:    c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		logger.LogError(err, "Failed to bind JSON parameters")
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := projectService.GetProject(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
