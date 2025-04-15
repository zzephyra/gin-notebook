package note

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
)

func GetWorkspaceNotesList(workspaceID string, UserID int64, limit int, offset int) (responseCode int, data any) {
	data, err := repository.GetNotesList(workspaceID, UserID, limit, offset)
	logger.LogDebug("获取工作区笔记列表", map[string]interface{}{
		"workspace_id": workspaceID,
		"user_id":      UserID,
		"data":         data,
	})
	if err != nil {
		return message.ERROR_DATABASE, err
	}
	return message.SUCCESS, data
}

func GetWorkspaceNotesCategory(workspaceID int64) (responseCode int, data any) {
	data, err := repository.GetNoteCategory(workspaceID)
	if err != nil {
		logger.LogError(err, "获取工作区笔记分类失败")
		return message.ERROR_DATABASE, nil
	}

	logger.LogDebug("获取工作区笔记分类", map[string]interface{}{
		"data": data,
	})
	return message.SUCCESS, data
}
