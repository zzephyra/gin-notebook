package projectService

import (
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/utils/algorithm"
	"gin-notebook/pkg/utils/tools"

	"github.com/jinzhu/copier"
	"github.com/morikuni/go-lexorank"
	"gorm.io/gorm"
)

func CreateProjectTask(params *dto.CreateProjectTaskDTO) (responseCode int, data map[string]interface{}) {
	task := model.ToDoTask{}
	copier.Copy(&task, params.Payload)

	// 同步前端数据
	task.Creator = params.Creator
	task.ProjectID = params.ProjectID
	task.ColumnID = params.ColumnID

	const maxRetry = 3
	var latestError error
	for attempt := 0; attempt < maxRetry; attempt++ {
		err := database.DB.Transaction(func(tx *gorm.DB) error {
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

			var middleOrder string
			fmt.Println(params.AfterID > 0, params.BeforeID, tasks)
			if hasAfterTask && hasBeforeTask {
				if len(tasks) != 2 {
					responseCode = message.ERROR_INVALID_TASK_ID
					return gorm.ErrInvalidData
				}
				middleOrder = algorithm.RankBetween(tasks[0].Order, tasks[1].Order)
			} else if hasAfterTask || hasBeforeTask {
				if len(tasks) != 1 {
					responseCode = message.ERROR_INVALID_TASK_ID
					return gorm.ErrInvalidData
				}
				fmt.Println("rank", lexorank.BucketKey(tasks[0].Order))
				if hasAfterTask {
					middleOrder = algorithm.RankBetweenBucket(lexorank.BucketKey(tasks[0].Order), algorithm.RankMax()).String()
				} else {
					middleOrder = algorithm.RankBetweenBucket(algorithm.RankMin(), lexorank.BucketKey(tasks[0].Order)).String()
				}

				fmt.Println("middleOrder", middleOrder)
			} else {
				middleOrder = algorithm.RankBetweenBucket(algorithm.RankMin(), algorithm.RankMax()).String()
			}

			task.Order = middleOrder

			if err := repository.CreateProjectTask(tx, &task); err != nil {
				responseCode = database.IsError(err)
				return err
			}

			if params.Payload.Assignee != nil && len(*params.Payload.Assignee) > 0 {
				assignees := make([]model.ToDoTaskAssignee, 0, len(*params.Payload.Assignee))
				for _, assignee := range *params.Payload.Assignee {
					assignees = append(assignees, model.ToDoTaskAssignee{
						AssigneeID: assignee.ID,
						ToDoTaskID: task.ID,
					})
				}

				if err := repository.CreateProjectTaskAssignees(tx, &assignees); err != nil {
					responseCode = database.IsError(err)
					return err
				}
			}

			return nil
		})

		latestError = err // 保存最新的错误

		if err == nil {
			break // 成功则退出重试
		}
	}

	if latestError != nil {
		return responseCode, nil
	}

	responseCode = message.SUCCESS
	data = tools.StructToUpdateMap(&task, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt", "Creator"})
	return
}
