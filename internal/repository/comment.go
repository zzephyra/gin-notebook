package repository

import (
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func GetProjectTaskCommentsByTaskID(db *gorm.DB, taskID int64, limit, offset int, OrderField, orderBy string, memberID int64, mentionMe, hasAttachment bool) ([]dto.CommentItem, int64, error) {
	var comments []dto.CommentItem
	var total int64

	columnWhitelist := map[string]clause.Column{
		"create": {Name: "created_at"},
		"update": {Name: "updated_at"},
	}

	col, ok := columnWhitelist[strings.ToLower(orderBy)]
	if !ok {
		col = clause.Column{Name: "created_at"} // 默认列
	}

	// 2) 方向白名单（只允许 asc / desc）
	dir := strings.ToLower(OrderField)
	desc := true
	if dir == "asc" {
		desc = false
	}

	if limit <= 0 {
		limit = 20 // 默认每页20条
	}
	if offset < 0 {
		offset = 0 // 偏移不能小于0
	}

	if OrderField == "" {
		OrderField = "created_at" // 默认按创建时间排序
	}

	if orderBy == "" {
		orderBy = "desc" // 默认降序
	}

	sql := db.
		Debug().
		Model(&model.ToDoTaskComment{}).
		Joins("LEFT JOIN to_do_comment_likes tdcl ON tdcl.comment_id = to_do_task_comments.id AND tdcl.member_id = ?", memberID).
		Joins("LEFT JOIN workspace_members wm ON wm.id = to_do_task_comments.member_id").
		Joins("LEFT JOIN users u ON u.id = wm.user_id").
		Select(`
			to_do_task_comments.*, 
			COALESCE(tdcl.is_like, FALSE) AS liked_by_me, 
			COALESCE(NOT tdcl.is_like, FALSE) AS disliked_by_me`).
		Where("to_do_task_id = ?", taskID).
		Offset(offset).Limit(limit).
		Order(clause.OrderBy{
			Columns: []clause.OrderByColumn{
				{Column: col, Desc: desc},
			},
		})

	if mentionMe {
		sql = sql.Where(`
            EXISTS (
              SELECT 1 
              FROM to_do_comment_mentions m
              WHERE m.comment_id = to_do_task_comments.id
                AND m.member_id  = ?
                AND m.deleted_at IS NULL
            )`, memberID)
	}

	if hasAttachment {
		sql = sql.Where(`
            EXISTS (
              SELECT 1 
              FROM to_do_comment_attachments a
              WHERE a.comment_id = to_do_task_comments.id
                AND a.deleted_at IS NULL
            )`)
	}

	err := sql.Find(&comments).Error
	if err != nil {
		return nil, 0, err
	}

	err = sql.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	return comments, total, nil
}

func GetCommentMentionByIDs(db *gorm.DB, commentIDs []int64) ([]dto.MentionResponse, error) {
	var mentions []dto.MentionResponse

	err := db.Model(&model.ToDoCommentMention{}).
		Select("id, comment_id, member_id, start_rune, end_rune").
		Where("comment_id IN ?", commentIDs).
		Scan(&mentions).Error
	if err != nil {
		return nil, err
	}

	return mentions, nil
}

func GetCommentAttachmentByIDs(db *gorm.DB, commentIDs []int64) ([]dto.AttachmentResponse, error) {
	var attachments []dto.AttachmentResponse

	err := db.Model(&model.ToDoCommentAttachment{}).
		Select("id, comment_id, file_name, file_url, file_size, file_type, thumbnail_path, uploader_id").
		Where("comment_id IN ?", commentIDs).
		Scan(&attachments).Error
	if err != nil {
		return nil, err
	}

	return attachments, nil
}
