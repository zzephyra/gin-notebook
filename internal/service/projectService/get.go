package projectService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/tools"
)

func GetProject(params *dto.GetProjectDTO) (responseCode int, data map[string]interface{}) {
	isExist, err := repository.ProjectExistsByID(database.DB, params.ProjectID, params.WorkspaceID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	if !isExist {
		responseCode = message.ERROR_PROJECT_NOT_EXIST
		return
	}

	columns, err := repository.GetProjectColumnsByProjectID(database.DB, params.ProjectID)

	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	columnsMap := make(map[int64]*map[string]interface{})
	columnsIDs := make([]int64, 0, len(columns))
	for _, column := range columns {
		parseColumn := tools.StructToUpdateMap(column, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt"})
		parseColumn["tasks"] = []map[string]interface{}{} // 初始化任务列表

		columnsMap[column.ID] = &parseColumn
		columnsIDs = append(columnsIDs, column.ID)
	}

	tasks, err := repository.GetProjectTasksByColumns(database.DB, columnsIDs, 0)
	if err != nil {
		responseCode = database.IsError(err)
		return
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
		return
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
		parseTaks := tools.StructToUpdateMap(task.ToDoTask, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt"})
		parseTaks["assignee"] = assigneesMap[task.ID] // 初始化分配人
		(*column)["tasks"] = append((*column)["tasks"].([]map[string]interface{}), parseTaks)
		(*column)["total"] = task.TotalCount
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
