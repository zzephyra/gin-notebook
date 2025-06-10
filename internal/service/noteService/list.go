package noteService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
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

func GetWorkspaceNotesCategory(params *dto.NoteCategoryQueryDTO) (responseCode int, data any) {
	data, err := repository.GetNoteCategory(params)
	if err != nil {
		logger.LogError(err, "获取工作区笔记分类失败")
		return message.ERROR_DATABASE, nil
	}

	logger.LogDebug("获取工作区笔记分类", map[string]interface{}{
		"data": data,
	})
	return message.SUCCESS, data
}

func GetRecommandNotesCategory(params *dto.RecommendNoteCategoryQueryDTO) (responseCode int, data dto.RecommendNoteCategoryDTO) {
	var err error
	data = dto.RecommendNoteCategoryDTO{
		Hot:    nil,
		Recent: nil,
	}

	recentData, err := repository.GetRecentCreatedCategories(params.WorkspaceID, 2)
	if err != nil {
		logger.LogError(err, "获取最近创建的分类失败")
	} else {
		data.Recent = recentData
	}

	hotData, err := repository.GetFrequentUsedCategories(params.WorkspaceID, 2)
	if err != nil {
		logger.LogError(err, "获取最近创建的分类失败")
	} else {
		data.Hot = hotData
	}

	logger.LogDebug("获取工作区笔记分类", map[string]interface{}{
		"data": data,
	})

	// 返回响应码和 data
	return message.SUCCESS, data
}

func GetFavoriteNoteList(params *dto.FavoriteNoteQueryDTO) (responseCode int, data *[]dto.WorkspaceNoteDTO) {
	data, err := repository.GetFavoriteNoteList(params)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}
