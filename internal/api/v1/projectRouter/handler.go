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
	params := &dto.ProjectTaskDTO{
		Creator: c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for ProjectTaskDTO")
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

func UpdateProjectTaskApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.ProjectTaskDTO{
		Creator: c.MustGet("userID").(int64),
		TaskID:  TaskID,
	}
	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for ProjectTaskDTO")
		return
	}
	responseCode := projectService.UpdateProjectTask(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, nil))
}

func CreateProjecttaskCommentsApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.CreateToDoTaskCommentDTO{
		UserID: c.MustGet("userID").(int64),
		TaskID: TaskID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for ProjectTaskDTO")
		return
	}
	responseCode, data := projectService.CreateTaskComment(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func GetProjecttaskCommentsApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.GetProjectTaskCommentsDTO{
		UserID:   c.MustGet("userID").(int64),
		MemberID: c.MustGet("workspaceMemberID").(int64),
		TaskID:   TaskID,
	}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for ProjectTaskDTO")
		return
	}
	responseCode, data := projectService.GetTaskComment(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func DeletetaskCommentsApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	commentID, isExist := c.Params.Get("commentID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_COMMENT_ID, nil))
		return
	}

	CommentID, err := strconv.ParseInt(commentID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_COMMENT_ID, nil))
		return
	}

	params := &dto.DeleteTaskCommentDTO{
		MemberID:  c.MustGet("workspaceMemberID").(int64),
		TaskID:    TaskID,
		CommentID: CommentID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteTaskCommentDTO")
		return
	}
	responseCode := projectService.DeleteTaskComment(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func UpdatetaskCommentsApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	commentID, isExist := c.Params.Get("commentID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_COMMENT_ID, nil))
		return
	}

	CommentID, err := strconv.ParseInt(commentID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_COMMENT_ID, nil))
		return
	}

	params := &dto.UpdateTaskCommentDTO{
		MemberID:  c.MustGet("workspaceMemberID").(int64),
		TaskID:    TaskID,
		CommentID: CommentID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteTaskCommentDTO")
		return
	}
	responseCode, data := projectService.UpdateTaskComment(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreatetaskCommentAttachmentApi(c *gin.Context) {
	taskID, isExist := c.Params.Get("taskID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	TaskID, err := strconv.ParseInt(taskID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	commentID, isExist := c.Params.Get("commentID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_COMMENT_ID, nil))
		return
	}

	CommentID, err := strconv.ParseInt(commentID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_COMMENT_ID, nil))
		return
	}

	params := &dto.CreateTaskCommentAttachmentDTO{
		MemberID:  c.MustGet("workspaceMemberID").(int64),
		TaskID:    TaskID,
		CommentID: CommentID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteTaskCommentDTO")
		return
	}

	responseCode, data := projectService.CreateCommentAttachment(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
