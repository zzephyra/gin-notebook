package projectService

import (
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/algorithm"
	"gin-notebook/pkg/utils/tools"
	"strconv"

	"github.com/morikuni/go-lexorank"
	"gorm.io/gorm"
)

func UpdateProjectTask(params *dto.ProjectTaskDTO) (responseCode int) {

	task := tools.StructToUpdateMap(params.Payload, nil, []string{"ID", "CreatedAt", "UpdatedAt", "DeletedAt"})

	database.DB.Transaction(func(tx *gorm.DB) error {
		var hasAfterTask, hasBeforeTask bool
		var taskIDs []int64
		if params.AfterID > 0 {
			hasAfterTask = true
			taskIDs = append(taskIDs, params.AfterID)
		}

		if params.BeforeID > 0 {
			hasBeforeTask = true
			taskIDs = append(taskIDs, params.BeforeID)
		}

		tasks, err := repository.GetProjectTaskByIDs(tx, taskIDs, params.ColumnID, true)
		if err != nil {
			return err
		}

		if hasAfterTask && hasBeforeTask {
			if len(tasks) != 2 {
				responseCode = message.ERROR_INVALID_TASK_ID
				return gorm.ErrInvalidData
			}
			task["OrderIndex"] = algorithm.RankBetween(tasks[0].OrderIndex, tasks[1].OrderIndex)
		} else if hasAfterTask || hasBeforeTask {
			if len(tasks) != 1 {
				responseCode = message.ERROR_INVALID_TASK_ID
				return gorm.ErrInvalidData
			}
			if hasAfterTask {
				task["OrderIndex"] = algorithm.RankBetweenBucket(lexorank.BucketKey(tasks[0].OrderIndex), algorithm.RankMax()).String()
			} else {
				task["OrderIndex"] = algorithm.RankBetweenBucket(algorithm.RankMin(), lexorank.BucketKey(tasks[0].OrderIndex)).String()
			}
		}

		err = repository.UpdateTaskByTaskID(tx, params.TaskID, task)
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		// 更新任务负责人
		if params.Payload.AssigneeActions != nil {
			addAssignees := make([]model.ToDoTaskAssignee, 0)
			removeAssignees := make([]int64, 0)
			// 创建任务分配人
			for _, assignee := range params.Payload.AssigneeActions.ActionAdd {
				parsedAssignee, err := strconv.ParseInt(assignee, 10, 64)
				if err != nil {
					continue // 如果转换失败，跳过这个分配人
				}
				assigneeModel := model.ToDoTaskAssignee{
					ToDoTaskID: params.TaskID,
					AssigneeID: parsedAssignee,
				}
				addAssignees = append(addAssignees, assigneeModel)
			}

			if len(addAssignees) > 0 {
				err = repository.CreateModel(tx, &addAssignees)
				if err != nil {
					responseCode = database.IsError(err)
					return err
				}
			}

			if len(params.Payload.AssigneeActions.ActionRemove) > 0 {
				for _, assignee := range params.Payload.AssigneeActions.ActionRemove {
					parsedAssignee, err := strconv.ParseInt(assignee, 10, 64)
					if err != nil {
						continue // 如果转换失败，跳过这个分配人
					}
					removeAssignees = append(removeAssignees, parsedAssignee)
				}

				err = repository.RemoveTaskAssigneesByTaskIDAndUserIDs(tx, params.TaskID, removeAssignees)
				if err != nil {
					responseCode = database.IsError(err)
					return err
				}
			}
		}
		return nil
	})

	if responseCode != 0 {
		return responseCode
	}
	responseCode = message.SUCCESS
	return
}
