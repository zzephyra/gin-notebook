package projectService

import (
	"errors"
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
	"gin-notebook/pkg/utils/tools"
	"strconv"

	"github.com/jinzhu/copier"
	"github.com/morikuni/go-lexorank"
	"gorm.io/gorm"
)

func UpdateProjectTask(params *dto.ProjectTaskDTO) (responseCode int, data map[string]interface{}) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if params.Payload.HasTaskFieldUpdates() {
			var hasAfterTask, hasBeforeTask bool
			task := tools.StructToUpdateMap(params.Payload, nil, []string{"ID", "CreatedAt", "UpdatedAt", "DeletedAt", "AssigneeActions", "BeforeID", "AfterID"})
			var taskIDs []int64
			if params.Payload.AfterID != nil {
				hasAfterTask = true
				taskIDs = append(taskIDs, *params.Payload.AfterID)
			}

			if params.Payload.BeforeID != nil {
				hasBeforeTask = true
				taskIDs = append(taskIDs, *params.Payload.BeforeID)
			}

			tasks, err := repository.GetProjectTaskByIDs(tx, taskIDs, true)
			if err != nil {
				return err
			}
			logger.LogInfo("Got tasks for ranking:", taskIDs)

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

			taskModel, err, isConflicted := repository.UpdateTaskByTaskID(tx, params.TaskID, params.UpdatedAt, task)
			if data == nil {
				data = make(map[string]interface{})
			}

			if taskModel != nil {
				data["task"] = tools.StructToUpdateMap(*taskModel, nil, []string{"DeletedAt", "CreatedAt", "Creator"})
			}

			if isConflicted {
				responseCode = message.ERROR_TASK_UPDATE_CONFLICTED
				data["conflicted"] = true
				return errors.New("update conflicted")
			}

			if err != nil {
				logger.LogError(err, "Failed to update task")
				responseCode = database.IsError(err)
				data["conflicted"] = isConflicted
				return err
			}
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
				err := repository.CreateModel(tx, &addAssignees)
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

				err := repository.RemoveTaskAssigneesByTaskIDAndMemberIDs(tx, params.TaskID, removeAssignees)
				if err != nil {
					responseCode = database.IsError(err)
					return err
				}
			}
		}
		return nil
	})

	if err != nil {
		if responseCode == 0 {
			responseCode = message.ERROR_TASK_UPDATE
		}
		return
	}
	responseCode = message.SUCCESS
	return
}

func UpdateTaskComment(params *dto.UpdateTaskCommentDTO) (responseCode int, data map[string]interface{}) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		err := repository.UpdateCommentByID(tx, params.CommentID, map[string]interface{}{
			"Content": params.Content,
		})
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		comment, err := repository.GetCommentByID(tx, params.CommentID, params.MemberID)
		if err != nil || comment == nil {
			responseCode = database.IsError(err)
			return err
		}

		data = tools.StructToUpdateMap(comment, nil, []string{"DeletedAt", "MemberID"})

		if err := repository.DeleteCommentMentionByCommentID(tx, params.CommentID); err != nil {
			responseCode = database.IsError(err)
			return err
		}

		memtionUserIDs := []int64{
			params.MemberID, // 添加评论者自己
		}

		Mentions := make([]model.ToDoCommentMention, 0, len(params.Mentions))
		Attachments, err := repository.GetCommentAttachmentByCommentID(tx, params.CommentID)
		if len(params.Mentions) > 0 {
			for i := range params.Mentions {
				params.Mentions[i].CommentID = comment.ID
				if params.Mentions[i].MemberID > 0 {
					memtionUserIDs = append(memtionUserIDs, params.Mentions[i].MemberID)
				}
				mentionModel := &model.ToDoCommentMention{}
				if err := copier.Copy(&mentionModel, &params.Mentions[i]); err != nil {
					// 如果复制失败，返回错误
					responseCode = message.ERROR_MENTION_CREATE_FAILED
					return err
				}
				fmt.Println("Creating mention:", mentionModel)
				fmt.Println("Comment ID:", params.Mentions[i])
				Mentions = append(Mentions, *mentionModel)
			}
			if err := repository.CreateModel(tx, &Mentions); err != nil {
				responseCode = database.IsError(err)
				return err
			}
		}

		workspaceMembers, err := repository.GetWorkspaceMemberByIDs(memtionUserIDs)
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		workspaceMembersMap := make(map[int64]dto.WorkspaceMemberDTO)
		for _, workspaceMember := range *workspaceMembers {
			workspaceMembersMap[workspaceMember.ID] = workspaceMember
		}

		if author, ok := workspaceMembersMap[comment.MemberID]; ok {
			data["author"] = tools.StructToUpdateMap(&author, nil, []string{"DeletedAt", "UserID"})
		}

		data["mentions"] = make([]map[string]interface{}, 0)
		for _, memtion := range Mentions {
			m := tools.StructToUpdateMap(&memtion, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt", "CommentID"})
			if member, ok := workspaceMembersMap[memtion.MemberID]; ok {
				m["member"] = tools.StructToUpdateMap(&member, nil, []string{"DeletedAt", "UserID"})
			}
			data["mentions"] = append(data["mentions"].([]map[string]interface{}), m)
		}

		data["attachments"] = make([]map[string]interface{}, 0)
		for _, attachment := range Attachments {
			data["attachments"] = append(data["attachments"].([]map[string]interface{}), tools.StructToUpdateMap(&attachment, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt", "CommentID", "SHA256Hash", "UploaderID"}))
		}

		return nil
	})

	if err != nil {
		return responseCode, nil
	}
	responseCode = message.SUCCESS
	return

}
