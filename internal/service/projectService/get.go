package projectService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/realtime/bus"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"strconv"
)

var (
	PriorityMap = map[uint8]string{
		0: "",
		1: "low",
		2: "medium",
		3: "high",
	}
	StringToPriority = map[string]uint8{
		"":       0,
		"low":    1,
		"medium": 2,
		"high":   3,
	}
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
	columns, err := repository.GetProjectColumnsByProjectID(database.DB, params.ProjectID, params.ColumnIDs)

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

	var bounds map[int64]repository.CursorTok
	if params.BID != nil || params.B1 != nil {
		bounds = make(map[int64]repository.CursorTok)
		for _, columnID := range columnsIDs {
			bounds[columnID] = repository.CursorTok{
				BID: params.BID,
				B1:  params.B1,
			}
		}

	} else {
		bounds, err = repository.GetColumnsBounded(database.DB, columnsIDs, orderByFieldName, !params.Asc)
		if err != nil {
			logger.LogError(err, "获取看板列边界失败")
		}
	}

	if params.ColumnIDs != nil && len(*params.ColumnIDs) > 0 && params.FID != nil && params.F1 != nil {
		for i := range bounds {
			bound := bounds[i]
			bound.FID = params.FID
			bound.F1 = params.F1
			bounds[i] = bound
		}
	}

	tasks, pageInfo, err := repository.GetTasksByColumnsBounded(database.DB, columnsIDs, params.Limit, bounds, params.Asc, orderByFieldName)
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

		// 更新边界
		bound := bounds[task.ColumnID]
		f1, _ := tools.ToString(parseTaks[orderByFieldName])
		bound.F1 = &f1
		bound.FID = &task.ID
		bounds[task.ColumnID] = bound

		parseTaks["priority"] = PriorityMap[task.Priority]
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
			if (*column)["has_next"] == nil {
				(*column)["has_next"] = false
			}

			if (*column)["total"] == nil {
				(*column)["total"] = 0
			}
			(*column)["cursor"] = bounds[columnID]
			data["todo"] = append(data["todo"].([]map[string]interface{}), *column)

		}

	}

	responseCode = message.SUCCESS
	return
}
