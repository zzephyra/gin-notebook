package middleware

import (
	"bytes"
	"encoding/json"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/http/response"
	"gin-notebook/internal/repository"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

const (
	workspaceKey string = "workspace_id"
)

type WorkspaceAuthDto struct {
	WorkspaceID string `json:"workspace_id" validate:"required,gt=0"`
}

func RequireWorkspaceAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt64("userID")          // 假设已解码 JWT 拿到
		workspaceIDStr := c.Param(workspaceKey) // 从 URL 参数获取 workspace ID

		if workspaceIDStr == "" {
			workspaceIDStr = c.Query(workspaceKey)
		}

		if workspaceIDStr == "" {
			workspaceIDStr = c.PostForm(workspaceKey)
		}

		if workspaceIDStr == "" {
			bodyBytes, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, response.Response(message.ERROR_REQUEST_BODY, nil))
				return
			}
			var workspaceDto WorkspaceAuthDto
			if err := json.Unmarshal(bodyBytes, &workspaceDto); err != nil {
				c.AbortWithStatusJSON(http.StatusBadRequest, response.Response(message.ERROR_INVALID_PARAMS, nil))
				return
			}
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			workspaceIDStr = workspaceDto.WorkspaceID
		}
		if workspaceIDStr == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, response.Response(message.ERROR_EMPTY_WORKSPACE_ID, nil))
			return
		}

		workspaceID, err := strconv.ParseInt(workspaceIDStr, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, response.Response(message.ERROR_WORKSPACE_ID, nil))
			return
		}

		if !repository.IsUserAllowedToModifyWorkspace(userID, workspaceID) {
			c.AbortWithStatusJSON(http.StatusForbidden, response.Response(message.ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE, nil))
			return
		}

		c.Next()
	}
}
