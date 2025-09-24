package projectService

import (
	"context"
	"fmt"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
)

func GetWorkspaceProject(params *dto.ListProjectsDTO) (responseCode int, data map[string]interface{}) {
	projects, err := repository.GetProjectsByWorkspaceID(database.DB, params.WorkspaceID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	responseCode = message.SUCCESS
	data = map[string]interface{}{
		"projects": []map[string]interface{}{},
	}

	for _, project := range projects {
		data["projects"] = append(data["projects"].([]map[string]interface{}), tools.StructToUpdateMap(project, nil, []string{"DeletedAt", "CreatedAt", "UpdatedAt"}))
	}

	return
}

func GetTaskComment(params *dto.GetProjectTaskCommentsDTO) (responseCode int, data map[string]interface{}) {
	comments, total, err := repository.GetProjectTaskCommentsByTaskID(database.DB, params.TaskID, params.Limit, params.Offset, params.OrderField, params.OrderBy, params.MemberID, params.MentionMe, params.HasAttachment)
	if err != nil {
		logger.LogError(err, "获取任务评论失败")
		responseCode = database.IsError(err)
		return
	}

	memberIDs := make([]int64, 0, len(comments))
	commentIDs := make([]int64, 0, len(comments))
	for _, comment := range comments {
		memberIDs = append(memberIDs, comment.MemberID)
		commentIDs = append(commentIDs, comment.ID)
	}

	mentions, err := repository.GetCommentMentionByIDs(database.DB, commentIDs)
	if err != nil {
		logger.LogError(err, "获取评论提及失败")
		responseCode = database.IsError(err)
		return
	}

	mentionMap := make(map[int64][]dto.MentionResponse)

	for _, mention := range mentions {
		memberIDs = append(memberIDs, mention.MemberID)
		mentionMap[mention.CommentID] = append(mentionMap[mention.CommentID], mention)
	}

	attachments, err := repository.GetCommentAttachmentByIDs(database.DB, commentIDs)
	if err != nil {
		logger.LogError(err, "获取评论附件失败")
		responseCode = database.IsError(err)
		return
	}

	attachmentMap := make(map[int64][]dto.AttachmentResponse)
	for _, attachment := range attachments {
		attachmentMap[attachment.CommentID] = append(attachmentMap[attachment.CommentID], attachment)
	}

	members, err := repository.GetWorkspaceMemberByIDs(database.DB, memberIDs)
	memberMap := make(map[int64]dto.WorkspaceMemberDTO)

	for _, member := range *members {
		memberMap[member.ID] = member
	}

	data = map[string]interface{}{
		"comments": []map[string]interface{}{},
		"total":    total,
	}

	for _, comment := range comments {
		parsedData := tools.StructToUpdateMap(comment, nil, []string{"DeletedAt", "UpdatedAt", "AuthorID", "MemberID"})
		if author, ok := memberMap[comment.MemberID]; ok {
			parsedData["author"] = tools.StructToUpdateMap(&author, nil, []string{"DeletedAt", "UserID"})
		} else {
			parsedData["author"] = nil
		}
		commentMentions, ok := mentionMap[comment.ID]
		if ok {
			for i := range commentMentions {
				commentMentions[i].Member = memberMap[commentMentions[i].MemberID]
			}

			parsedData["mentions"] = commentMentions
		}

		commentAttachments, ok := attachmentMap[comment.ID]
		if ok {
			parsedData["attachments"] = commentAttachments
		}

		data["comments"] = append(data["comments"].([]map[string]interface{}), parsedData)
	}

	responseCode = message.SUCCESS
	return
}

func GetProjectTaskActivity(ctx context.Context, params *dto.GetProjectTaskActivityDTO) (responseCode int, data map[string]interface{}) {
	activities, total, err := repository.GetProjectTaskActivitiesByTaskID(database.DB, params.TaskID, params.Limit, params.Offset, params.Start, params.End)
	if err != nil {
		logger.LogError(err, "获取任务活动失败")
		responseCode = database.IsError(err)
		return
	}

	for i := range activities {
		nickname := activities[i].UserNickname
		fmt.Println("avatar:", activities[i].Avatar)
		if activities[i].MemberNickname != "" {
			nickname = activities[i].MemberNickname
		}

		activities[i].Member = dto.UserBreifDTO{
			ID:       activities[i].MemberID,
			Nickname: nickname,
			Avatar:   activities[i].Avatar,
			Email:    activities[i].Email,
		}
	}

	// 标记为已读

	data = map[string]interface{}{
		"activities": activities,
		"total":      total,
	}
	responseCode = message.SUCCESS
	return
}
