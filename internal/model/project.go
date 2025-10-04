package model

import (
	"time"

	"gorm.io/gorm"
)

type Project struct {
	BaseModel
	Icon        *string `json:"icon" gorm:"type:text;default:NULL"` // 项目图标
	Name        string  `json:"name" gorm:"not null; type:varchar(100); index:idx_name"`
	Description string  `json:"description" gorm:"type:text"`
	OwnerID     int64   `json:"owner_id,string" gorm:"not null; index:idx_owner_id"`
	WorkspaceID int64   `json:"workspace_id,string" gorm:"not null; index:idx_workspace_id"`
	Status      string  `json:"status" gorm:"default:'active'; index:idx_status"` // active, archived, completed
}

func (p *Project) AfterCreate(tx *gorm.DB) (err error) {
	err = tx.Create(&ProjectSetting{
		ProjectID: p.ID,
	}).Error
	return
}

type ToDoColumn struct {
	BaseModel
	ProjectID   int64  `json:"project_id,string" gorm:"not null; index:idx_project_id"`
	Name        string `json:"name" gorm:"not null; type:varchar(100); index:idx_name"`
	Description string `json:"description" gorm:"type:text"`
	OrderIndex  string `json:"order_index" gorm:""`                      // 用于排序
	Color       string `json:"color" gorm:"type:varchar(20);default:''"` // 列颜色
	ProcessID   uint8  `json:"process_id" gorm:"index:idx_process_id"`   // 用于流程管理，区分统计项目进度，释放名称自定义
}

type ToDoTask struct {
	BaseModel
	ProjectID   int64      `json:"project_id,string" gorm:"not null; index:idx_project_id"`
	Title       string     `json:"title" gorm:"not null; type:varchar(200); index:idx_title"`
	OrderIndex  string     `json:"order_index" gorm:"not null;varchar(10);uniqueIndex:uniq_column_order,priority:2"`
	ColumnID    int64      `json:"column_id,string" gorm:"not null;uniqueIndex:uniq_column_order,priority:1"`
	Creator     int64      `json:"creator,string" gorm:"not null; index:idx_creator"`
	Priority    uint8      `json:"priority" gorm:"index:idx_priority;default:0"` // 0(未定义), 1(低), 2(中), 3(高)
	Status      string     `json:"status" gorm:"index:idx_status"`               // pending, in_progress, completed
	Description string     `json:"description" gorm:"type:text"`                 // 任务描述
	Deadline    *time.Time `json:"deadline" gorm:"type:date"`                    // 任务截止时间
	Cover       *string    `json:"cover" gorm:"type:varchar(255);default:NULL"`  // 任务封面图片
}

type ToDoTaskAssignee struct {
	BaseModel
	AssigneeID int64 `json:"assignee_id,string" gorm:"not null;uniqueIndex:idx_task_assignee,priority:2"`  // 任务负责人
	ToDoTaskID int64 `json:"todo_task_id,string" gorm:"not null;uniqueIndex:idx_task_assignee,priority:1"` // 任务ID
}

type ToDoTaskComment struct {
	BaseModel
	ToDoTaskID int64  `json:"todo_task_id,string" gorm:"not null; index:idx_todo_task_id"` // 任务ID
	MemberID   int64  `json:"member_id,string" gorm:"not null; index:idx_author_id"`       // 评论作者ID
	Content    string `json:"content" gorm:"not null; type:text"`                          // 评论内容
	Likes      int64  `json:"likes" gorm:"default:0"`                                      // 点赞数
	Dislikes   int64  `json:"dislikes" gorm:"default:0"`                                   // 点踩数
	ParentID   int64  `json:"parent_id,string" gorm:"default:0; index:idx_parent_id"`      // 父评论ID，0表示顶级评论
	ReplyCount int64  `json:"reply_count" gorm:"default:0"`                                // 回复数
	Status     string `json:"status" gorm:"default:'published'; index:idx_status"`         // 评论状态，active, deleted
}

type ToDoCommentAttachment struct {
	BaseModel
	CommentID     int64  `json:"comment_id,string" gorm:"not null; index:idx_comment_id"`              // 评论ID
	FileName      string `json:"name" gorm:"not null; type:varchar(255); index:idx_file_name"`         // 附件文件名
	FileURL       string `json:"url" gorm:"not null; type:varchar(255)"`                               // 附件文件URL
	FileSize      int64  `json:"size" gorm:"not null"`                                                 // 附件文件大小
	FileType      string `json:"type" gorm:"not null; type:varchar(50); index:idx_file_type"`          // 附件文件类型
	ThumbnailPath string `json:"thumbnail_path" gorm:"type:varchar(255)"`                              // 缩略图路径，图片附件可用
	UploaderID    int64  `json:"uploader_id,string" gorm:"not null; index:idx_uploader_id"`            // 上传者ID
	SHA256Hash    string `json:"sha256_hash" gorm:"not null; type:varchar(64); index:idx_sha256_hash"` // 文件的SHA256哈希值，用于文件完整性校验
}

type ToDoCommentLike struct {
	BaseModel
	CommentID int64 `json:"comment_id,string" gorm:"not null;index:idx_comment_member,unique"`
	MemberID  int64 `json:"member_id,string" gorm:"not null;index:idx_comment_member,unique"`
	IsLike    bool  `json:"is_like"` // true: 点赞, false: 点踩
}

type ToDoCommentMention struct {
	BaseModel
	CommentID int64 `json:"comment_id,string"        gorm:"not null; index:idx_comment_id"`
	MemberID  int64 `json:"member_id,string" gorm:"not null; index:idx_mentioned_member_id"`
	StartRune int   `json:"start_rune" gorm:"not null; index:idx_comment_pos"`
	EndRune   int   `json:"end_rune"   gorm:"not null"`
}
