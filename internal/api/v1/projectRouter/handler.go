package projectRouter

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/projectService"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"gin-notebook/pkg/utils/validator"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateProjectTaskApi(c *gin.Context) {
	params := &dto.ProjectTaskDTO{
		Creator:  c.MustGet("userID").(int64),
		MemberID: c.MustGet("workspaceMemberID").(int64),
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

	responseCode, data := projectService.CreateProjectTask(c.Request.Context(), params)
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
		MemberID:  c.MustGet("workspaceMemberID").(int64),
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
		Creator:  c.MustGet("userID").(int64),
		TaskID:   TaskID,
		MemberID: c.MustGet("workspaceMemberID").(int64),
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
	responseCode, data := projectService.UpdateProjectTask(c.Request.Context(), params)
	if data != nil {
		c.JSON(http.StatusOK, response.Response(responseCode, data))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
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
	responseCode, data := projectService.CreateTaskComment(c.Request.Context(), params)
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

func DeleteProjectColumnApi(c *gin.Context) {
	columnID, isExist := c.Params.Get("columnID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	ColumnID, err := strconv.ParseInt(columnID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.DeleteProjectColumnDTO{
		MemberID: c.MustGet("workspaceMemberID").(int64),
		ColumnID: ColumnID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteProjectColumnDTO")
		return
	}
	responseCode := projectService.CleanColumnTasks(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func UpdateProjectColumnApi(c *gin.Context) {
	columnID, isExist := c.Params.Get("columnID")
	if !isExist {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_PROJECT_ID, nil))
		return
	}

	ColumnID, err := strconv.ParseInt(columnID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.UpdateProjectColumnDTO{
		MemberID: c.MustGet("workspaceMemberID").(int64),
		ColumnID: ColumnID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteProjectColumnDTO")
		return
	}
	responseCode, data := projectService.UpdateColumn(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetProjectTaskActivityApi(c *gin.Context) {
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

	params := &dto.GetProjectTaskActivityDTO{
		UserID:   c.MustGet("userID").(int64),
		TaskID:   TaskID,
		MemberID: c.MustGet("workspaceMemberID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for GetProjectTaskActivityDTO")
		return
	}
	responseCode, data := projectService.GetProjectTaskActivity(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func LikeTaskCommentApi(c *gin.Context) {
	TaskID, isOk := tools.GetValueFromParams(c.Params, "taskID", "int64")

	if !isOk {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	CommentID, isOk := tools.GetValueFromParams(c.Params, "commentID", "int64")
	if !isOk {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_COMMENT_ID, nil))
		return
	}

	params := &dto.CreateLikeTaskCommentDTO{
		UserID:    c.MustGet("userID").(int64),
		MemberID:  c.MustGet("workspaceMemberID").(int64),
		TaskID:    TaskID.(int64),
		CommentID: CommentID.(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for LikeTaskCommentDTO")
		return
	}
	responseCode, data := projectService.CreateLikeTaskComment(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func DeleteLikeTaskCommentApi(c *gin.Context) {
	TaskID, isOk := tools.GetValueFromParams(c.Params, "taskID", "int64")

	if !isOk {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	CommentID, isOk := tools.GetValueFromParams(c.Params, "commentID", "int64")
	if !isOk {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_COMMENT_ID, nil))
		return
	}

	params := &dto.DeleteLikeTaskCommentDTO{
		MemberID:  c.MustGet("workspaceMemberID").(int64),
		TaskID:    TaskID.(int64),
		CommentID: CommentID.(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteLikeTaskCommentDTO")
		return
	}
	responseCode := projectService.DeleteTaskCommentLike(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func DeleteProjectTaskApi(c *gin.Context) {
	TaskID, isOk := tools.GetValueFromParams(c.Params, "taskID", "int64")

	if !isOk {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PROJECT_ID, nil))
		return
	}

	params := &dto.DeleteProjectTaskDTO{
		MemberID: c.MustGet("workspaceMemberID").(int64),
		TaskID:   TaskID.(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for DeleteLikeTaskCommentDTO")
		return
	}
	responseCode := projectService.DeleteProjectTask(params)
	c.JSON(http.StatusOK, response.Response(responseCode, nil))
}

func UpdateProjectSettingApi(c *gin.Context) {
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

	params := &dto.UpdateProjectSettingDTO{
		ProjectID: ProjectID,
		MemberID:  c.MustGet("workspaceMemberID").(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for UpdateProjectSettingDTO")
		return
	}

	responseCode, data := projectService.UpdateProjectSetting(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UpdateProjectApi(c *gin.Context) {
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

	params := &dto.UpdateProjectDTO{
		ProjectID: ProjectID,
		MemberID:  c.MustGet("workspaceMemberID").(int64),
	}

	if err := c.ShouldBindJSON(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for UpdateProjectDTO")
		return
	}

	responseCode, data := projectService.UpdateProject(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetProjectBoardApi(c *gin.Context) {
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

	params := &dto.GetProjectBoardDTO{
		ProjectID: ProjectID,
		MemberID:  c.MustGet("workspaceMemberID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Failed to bind JSON parameters")
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		logger.LogError(err, "Validation failed for get board")
		return
	}

	responseCode, data := projectService.GetProjectBoard(c.Request.Context(), params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}
