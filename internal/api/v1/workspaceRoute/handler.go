package workspaceRoute

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/service/note"
	"gin-notebook/internal/service/workspace"
	"gin-notebook/pkg/logger"
	validator "gin-notebook/pkg/utils/validatior"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetWorkspaceListApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	responseCode, data := workspace.GetWorkspaceList(userID)
	if data != nil {
		data = map[string]interface{}{
			"workspaces": WorkspaceListSerializer(c, data.(*[]dto.WorkspaceListDTO)),
			"total":      len(*data.(*[]dto.WorkspaceListDTO)),
		}
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreateWorkspaceApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.WorkspaceValidation{
		Owner: userID,
	}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	err := validator.ValidateStruct(params)
	if err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}

	responseCode, data := workspace.CreateWorkspace(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetWorkspaceApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	workspaceID := c.Query("workspace_id")
	responseCode, data := workspace.GetWorkspace(workspaceID, userID)
	if data != nil {
		data = WorkspaceSerializer(c, data.(*dto.WorkspaceDTO))
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetWorkspaceNotesApi(c *gin.Context) {
	workspaceID := c.Query("workspace_id")
	offset, limit := c.DefaultQuery("offset", "0"), c.DefaultQuery("limit", "20")

	noteOffset, err := strconv.Atoi(offset)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	noteLimit, err := strconv.Atoi(limit)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	userID, err := strconv.ParseInt(c.DefaultQuery("user_id", "0"), 10, 64)
	if err != nil || userID <= 0 {
		userID = c.MustGet("userID").(int64)
	}

	responseCode, data := note.GetWorkspaceNotesList(workspaceID, userID, noteLimit, noteOffset)
	if data != nil {
		data = map[string]interface{}{
			"notes": data,
			"total": len(*data.(*[]dto.WorkspaceNoteDTO)),
		}
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))

}

func GetWorkspaceNotesCategoryApi(c *gin.Context) {
	params := &dto.NoteCategoryQueryDTO{}

	if err := c.ShouldBindQuery(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := note.GetWorkspaceNotesCategory(params)
	c.JSON(http.StatusOK, response.Response(responseCode, data))

}

func UpdateWorkspaceNoteApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.UpdateWorkspaceNoteValidator{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.OwnerID = userID
	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusBadRequest, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}
	responseCode, data := note.UpdateNote(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreateWorkspaceNoteApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.CreateWorkspaceNoteDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.OwnerID = userID

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}
	responseCode, data := note.CreateNote(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}

	// 序列化数据
	serializedData := WorkspaceNoteSerializer(c, data)

	c.JSON(http.StatusCreated, response.Response(responseCode, serializedData))
}

func UpdateWorkspaceCategoryApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.UpdateNoteCategoryDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.OwnerID = &userID
	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}

	responseCode, data := note.UpdateNoteCategory(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreateWorkspaceCategoryApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.CreateNoteCategoryDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.OwnerID = &userID
	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}

	responseCode, data := note.CreateNoteCategory(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}

func DeleteWorkspaceNoteApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.DeleteNoteCategoryDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	params.OwnerID = &userID
	fmt.Println("params", params)
	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}
	responseCode, data := note.DeleteNote(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetRecommandNotesCategoryApi(c *gin.Context) {
	// userID := c.MustGet("userID").(int64)
	params := &dto.RecommendNoteCategoryQueryDTO{}

	if err := c.ShouldBindQuery(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}
	fmt.Println("params", params)
	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_NOTE_VALIDATE, nil))
		return
	}

	responseCode, data := note.GetRecommandNotesCategory(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}

	RecommendNoteCategorySerializer(c, &data)

	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func UpdateWorkspaceApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.UpdateWorkspaceDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	params.WorkspaceID = workspaceID
	params.Owner = userID

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}

	responseCode, data := workspace.UpdateWorkspace(params)
	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func GetWorkspaceLinksListApi(c *gin.Context) {
	params := &dto.WorkspaceLinksDTO{
		WorkspaceID: c.Param("workspaceID"),
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}

	responseCode, data := workspace.GetWorkspaceLinks(params)

	if responseCode == message.SUCCESS {
		data = WorkspaceLinkListSerializer(c, data.(*[]model.WorkspaceInvite))
	}

	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func DeleteWorkspaceLinkApi(c *gin.Context) {
	params := &dto.DeleteWorkspaceInviteLinkDTO{
		LinkID: c.Param("id"),
		UserID: c.MustGet("userID").(int64),
	}

	if err := c.ShouldBindQuery(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	responseCode, data := workspace.DeleteWorkspaceLinks(params)

	c.JSON(http.StatusOK, response.Response(responseCode, data))
}

func CreateWorkspaceLinkApi(c *gin.Context) {
	userID := c.MustGet("userID").(int64)
	params := &dto.CreateWorkspaceInviteLinkDTO{}

	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	params.UserID = userID

	if err := validator.ValidateStruct(params); err != nil {
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}

	responseCode, data := workspace.CreateWorkspaceLinks(params)

	if responseCode != message.SUCCESS {
		c.JSON(http.StatusInternalServerError, response.Response(responseCode, nil))
		return
	}
	c.JSON(http.StatusCreated, response.Response(responseCode, WorkspaceLinkSerializer(c, data)))
}

func GetWorkspaceLinkApi(c *gin.Context) {
	LinkUUID := c.Param("linkUUID")

	params := &dto.GetWorkspaceInviteLinkDTO{
		LinkUUID: LinkUUID,
		UserID:   c.MustGet("userID").(int64),
	}
	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}

	responseCode, data := workspace.GetWorkspaceInviteLink(params)

	c.JSON(http.StatusCreated, response.Response(responseCode, data))

}

func CreateWorkspaceMemberByLinkApi(c *gin.Context) {
	params := &dto.CreateWorkspaceMemberDTO{}
	if err := c.ShouldBindJSON(params); err != nil {
		log.Printf("params %s", err)
		c.JSON(http.StatusInternalServerError, response.Response(message.ERROR_INVALID_PARAMS, nil))
		return
	}

	if err := validator.ValidateStruct(params); err != nil {
		logger.LogError(err, "验证失败：")
		c.JSON(http.StatusOK, response.Response(message.ERROR_WORKSPACE_VALIDATE, nil))
		return
	}
	responseCode, data := workspace.CreateWorkspaceMemberByLInk(params)
	c.JSON(http.StatusCreated, response.Response(responseCode, data))
}
