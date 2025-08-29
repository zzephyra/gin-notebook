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
	"strconv"

	"github.com/jinzhu/copier"
	"github.com/morikuni/go-lexorank"
	"gorm.io/gorm"
)

func CreateProjectTask(params *dto.ProjectTaskDTO) (responseCode int, data map[string]interface{}) {
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

			var middleOrder string
			if hasAfterTask && hasBeforeTask {
				if len(tasks) != 2 {
					responseCode = message.ERROR_INVALID_TASK_ID
					return gorm.ErrInvalidData
				}
				middleOrder = algorithm.RankBetween(tasks[0].OrderIndex, tasks[1].OrderIndex)
			} else if hasAfterTask || hasBeforeTask {
				if len(tasks) != 1 {
					responseCode = message.ERROR_INVALID_TASK_ID
					return gorm.ErrInvalidData
				}
				if hasAfterTask {
					middleOrder = algorithm.RankBetweenBucket(lexorank.BucketKey(tasks[0].OrderIndex), algorithm.RankMax()).String()
				} else {
					middleOrder = algorithm.RankBetweenBucket(algorithm.RankMin(), lexorank.BucketKey(tasks[0].OrderIndex)).String()
				}

			} else {
				middleOrder = algorithm.RankBetweenBucket(algorithm.RankMin(), algorithm.RankMax()).String()
			}
			task.OrderIndex = middleOrder

			if err := repository.CreateProjectTask(tx, &task); err != nil {
				responseCode = database.IsError(err)
				return err
			}

			if params.Payload.AssigneeActions != nil {
				assignees := make([]model.ToDoTaskAssignee, 0)
				// 创建任务分配人，只处理添加操作，无视删除操作
				for _, assignee := range params.Payload.AssigneeActions.ActionAdd {
					parsedAssignee, err := strconv.ParseInt(assignee, 10, 64)
					if err != nil {
						continue // 如果转换失败，跳过这个分配人
					}
					assigneeModel := model.ToDoTaskAssignee{
						ToDoTaskID: task.ID,
						AssigneeID: parsedAssignee,
					}
					assignees = append(assignees, assigneeModel)
				}

				if len(assignees) > 0 {
					repository.CreateModel(tx, &assignees)
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
	data = tools.StructToUpdateMap(&task, nil, []string{"DeletedAt", "CreatedAt", "Creator"})
	return
}

func CreateTaskComment(params *dto.CreateToDoTaskCommentDTO) (responseCode int, data map[string]interface{}) {
	// 验证用户权限
	isAllowed, err := repository.CheckWorkspaceMemberAuth(database.DB, params.WorkspaceID, params.UserID, params.MemberID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	if !isAllowed {
		responseCode = message.ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE
		return
	}

	comment := model.ToDoTaskComment{}
	copier.Copy(&comment, params)

	// 同步前端数据
	comment.MemberID = params.MemberID
	comment.ToDoTaskID = params.TaskID

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := repository.CreateModel(tx, &comment); err != nil {
			responseCode = database.IsError(err)
			return err
		}

		data = tools.StructToUpdateMap(&comment, nil, []string{"DeletedAt", "MemberID"})
		memtionUserIDs := []int64{
			comment.MemberID, // 添加评论者自己
		}

		Mentions := make([]model.ToDoCommentMention, 0, len(params.Mentions))
		if len(params.Mentions) > 0 {
			for i := range params.Mentions {
				params.Mentions[i].CommentID = comment.ID
				if params.Mentions[i].MemberID > 0 {
					memtionUserIDs = append(memtionUserIDs, params.Mentions[i].MemberID)
				}
				mentionModel := &model.ToDoCommentMention{}
				if err := copier.Copy(&mentionModel, &params.Mentions[i]); err != nil {
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
		Attachments := make([]model.ToDoCommentAttachment, 0, len(params.Attachments))
		if len(params.Attachments) > 0 {
			for i := range params.Attachments {
				params.Attachments[i].CommentID = comment.ID
				AttachmentModel := &model.ToDoCommentAttachment{}
				if err := copier.Copy(&AttachmentModel, &params.Attachments[i]); err != nil {
					return err
				}
				Attachments = append(Attachments, *AttachmentModel)
			}
			if err := repository.CreateModel(tx, &Attachments); err != nil {
				responseCode = database.IsError(err)
				return err
			}
		}

		// 处理所有用户查询
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
	return responseCode, data
}

func CreateCommentAttachment(params *dto.CreateTaskCommentAttachmentDTO) (responseCode int, data map[string]interface{}) {
	attachment := model.ToDoCommentAttachment{}
	copier.Copy(&attachment, params)

	// 同步前端数据
	attachment.UploaderID = params.MemberID

	if err := repository.CreateModel(database.DB, &attachment); err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	data = tools.StructToUpdateMap(&attachment, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt", "CommentID", "SHA256Hash", "UploaderID"})
	return responseCode, data
}
