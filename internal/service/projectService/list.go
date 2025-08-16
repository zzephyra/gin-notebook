package projectService

import (
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

	members, err := repository.GetWorkspaceMemberByIDs(memberIDs)
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
