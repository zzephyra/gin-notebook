package projectService

import (
	"context"
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/realtime/bus"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"strconv"
)

func GetProject(params *dto.GetProjectDTO) (responseCode int, data map[string]interface{}) {
	bus.BroadcastToProject(strconv.FormatInt(params.ProjectID, 10), "project_update", map[string]interface{}{
		"action": "viewed",
		"by":     params.MemberID,
	})
	projectModel, err := repository.GetProjectByID(database.DB, params.ProjectID, params.WorkspaceID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	if projectModel == nil {
		responseCode = message.ERROR_PROJECT_NOT_EXIST
		return
	}

	data = map[string]interface{}{
		"id":           strconv.FormatInt(projectModel.ID, 10),
		"name":         projectModel.Name,
		"icon":         projectModel.Icon,
		"description":  projectModel.Description,
		"workspace_id": strconv.FormatInt(projectModel.WorkspaceID, 10),
		"status":       projectModel.Status,
		"created_at":   projectModel.CreatedAt,
		"updated_at":   projectModel.UpdatedAt,
		"settings": map[string]interface{}{
			"card_preview":    projectModel.CardPreview,
			"is_public":       projectModel.IsPublic,
			"is_archived":     projectModel.IsArchived,
			"enable_comments": projectModel.EnableComments,
			"updated_at":      projectModel.SettingUpdatedAt,
		},
	}

	if projectModel.OwnerID != 0 {
		creator, err := repository.GetWorkspaceMemberByID(database.DB, projectModel.OwnerID)
		if err != nil {
			responseCode = database.IsError(err)
			return responseCode, nil
		}

		if creator != nil {
			data["owner"] = tools.StructToUpdateMap(creator, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt"})
		}
	}

	responseCode = message.SUCCESS
	return
}

func GetProjectBoard(ctx context.Context, params *dto.GetProjectBoardDTO) (responseCode int, data map[string]interface{}) {
	columns, err := repository.GetProjectColumnsByProjectID(database.DB, params.ProjectID)

	if err != nil {
		responseCode = database.IsError(err)
		return responseCode, nil
	}

	columnsMap := make(map[int64]*map[string]interface{})
	columnsIDs := make([]int64, 0, len(columns))
	for _, column := range columns {
		parseColumn := tools.StructToUpdateMap(column, nil, []string{"DeletedAt", "CreatedAt"})
		parseColumn["tasks"] = []map[string]interface{}{} // 初始化任务列表

		columnsMap[column.ID] = &parseColumn
		columnsIDs = append(columnsIDs, column.ID)
	}

	orderByFieldName := repository.OrderByMapping[params.OrderBy]
	if orderByFieldName == "" {
		orderByFieldName = "order_index"
	}

	bounds, err := repository.GetColumnsBounded(database.DB, columnsIDs, orderByFieldName, params.Asc)

	if err != nil {
		logger.LogError(err, "获取看板列边界失败")
	}

	for _, bound := range bounds {
		fmt.Println("B1:", *bound.B1, "BID:", *bound.BID)
	}

	tasks, pageInfo, err := repository.GetTasksByColumnsBounded(database.DB, columnsIDs, params.Limit, bounds, !params.Asc, orderByFieldName)
	if err != nil {
		responseCode = database.IsError(err)
		logger.LogError(err, "获取看板列边界任务失败")
		return responseCode, nil
	}

	taskIDs := make([]int64, 0, len(tasks))
	// 获取任务ID列表
	for _, task := range tasks {
		taskIDs = append(taskIDs, task.ID)
	}

	// 获取任务的分配人
	assignees, err := repository.GetProjectTaskAssigneesByTaskIDs(database.DB, taskIDs)
	if err != nil {
		responseCode = database.IsError(err)
		return responseCode, nil
	}

	// 将分配人转换为map，方便后续查找
	assigneesMap := make(map[int64][]dto.UserBreifDTO)
	for _, assignee := range assignees {
		assigneesMap[assignee.ToDoTaskID] = append(assigneesMap[assignee.ToDoTaskID], assignee.UserBreif())
	}

	for _, task := range tasks {
		column, ok := columnsMap[task.ColumnID]
		if !ok {
			continue
		}
		parseTaks := tools.StructToUpdateMap(task.ToDoTask, nil, []string{"DeletedAt", "CreatedAt"})
		parseTaks["assignee"] = assigneesMap[task.ID] // 初始化分配人
		(*column)["tasks"] = append((*column)["tasks"].([]map[string]interface{}), parseTaks)
		(*column)["total"] = pageInfo[task.ColumnID].Total
		(*column)["has_next"] = pageInfo[task.ColumnID].HasNext
	}

	data = map[string]interface{}{
		"todo": []map[string]interface{}{},
	}

	for _, columnID := range columnsIDs {
		if column, ok := columnsMap[columnID]; ok {
			data["todo"] = append(data["todo"].([]map[string]interface{}), *column)
		}
	}

	responseCode = message.SUCCESS
	return
}
