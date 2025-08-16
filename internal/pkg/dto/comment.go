package dto

import "time"

type EditableCommentMentionDTO struct {
	Action    string `json:"action" validate:"required,oneof=create update"`                       // 操作列表
	CommentID int64  `json:"comment_id,string" validate:"required_if=Action create,gt=0"`          // 评论ID
	MemberID  int64  `json:"member_id,string" validate:"gt=0"`                                     // 成员ID
	StartRune int    `json:"start_rune" validate:"required_if=Action create,gt=0"`                 // 提及开始位置
	EndRune   int    `json:"end_rune" validate:"required_if=Action create,gt=0,gtfield=StartRune"` // 提及结束位置
}

type ToDoCommentAttachmentDTO struct {
	Actions       string `json:"actions" validate:"required,oneof=create update"`         // 附件操作列表
	CommentID     int64  `json:"comment_id,string" validate:"gt=0"`                       // 评论ID
	FileName      string `json:"name" validate:"required_if=Action create,min=1"`         // 附件文件名
	FileURL       string `json:"url" validate:"required_if=Action create,min=1,max=255"`  // 附件文件URL
	FileSize      int64  `json:"size" validate:"required_if=Action create,gt=0"`          // 附件文件大小
	FileType      string `json:"type" validate:"required_if=Action create,min=1"`         // 附件文件类型
	ThumbnailPath string `json:"thumbnail_path" validate:"omitempty,min=1,max=255"`       // 缩略图路径，图片附件可用
	UploaderID    int64  `json:"uploader_id,string" validate:"required_if=Action create"` // 上传者ID
	SHA256Hash    string `json:"sha256_hash" validate:"omitempty,sha256"`                 // 文件的SHA256哈希值，用于文件完整性校验
}

type CreateToDoTaskCommentDTO struct {
	Content     string                      `json:"content" validate:"required,min=1,max=1000"`
	WorkspaceID int64                       `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
	Mentions    []EditableCommentMentionDTO `json:"mentions" validate:"omitempty"`                // @提及的用户ID列表
	Attachments []ToDoCommentAttachmentDTO  `json:"attachments" validate:"omitempty"`             // 附件列表
	MemberID    int64                       `json:"member_id,string" validate:"required,gt=0"`    // 评论作者ID
	UserID      int64                       `json:"user_id,string" validate:"required,gt=0"`      // 用户ID
	TaskID      int64                       `json:"task_id,string" validate:"required,gt=0"`      // 任务ID
}

type GetProjectTaskCommentsDTO struct {
	TaskID        int64  `validate:"required,gt=0"`                                 // 任务ID
	WorkspaceID   int64  `form:"workspace_id,string" validate:"required,gt=0"`      // 工作空间ID
	UserID        int64  `validate:"required,gt=0"`                                 // 用户ID
	MemberID      int64  `validate:"required,gt=0"`                                 // 成员ID
	Limit         int    `form:"limit" validate:"omitempty,gt=0"`                   // 分页限制
	Offset        int    `form:"offset" validate:"omitempty,gt=0"`                  // 分页偏移
	OrderField    string `form:"order_field" validate:"omitempty,oneof=asc desc"`   // 排序方式
	OrderBy       string `form:"order_by" validate:"omitempty,oneof=create update"` // 排序字段
	MentionMe     bool   `form:"mention_me" validate:"omitempty"`                   // 是否只获取提及我的评论
	HasAttachment bool   `form:"has_attachment" validate:"omitempty"`               // 是否只获取有附件的评论
}

type MentionResponse struct {
	ID        int64              `json:"id,string"`
	CommentID int64              `json:"comment_id,string"`
	MemberID  int64              `json:"member_id,string"`
	StartRune int                `json:"start_rune"`
	EndRune   int                `json:"end_rune"`
	Member    WorkspaceMemberDTO `json:"member,omitempty"`
}

type AttachmentResponse struct {
	ID            int64  `json:"id,string"`
	CommentID     int64  `json:"comment_id,string"`
	FileName      string `json:"name"`
	FileURL       string `json:"url"`
	FileSize      int64  `json:"size"`
	FileType      string `json:"type"`
	ThumbnailPath string `json:"thumbnail_path"`
	UploaderID    int64  `json:"uploader_id,string"`
}

type CommentResponse struct {
	ID            int64                `json:"id,string"`
	TaskID        int64                `json:"task_id,string"`
	AuthorID      int64                `json:"author_id,string"`
	Content       string               `json:"content"`
	Likes         int64                `json:"likes"`
	Dislikes      int64                `json:"dislikes"`
	ParentID      int64                `json:"parent_id,string"`
	ReplyCount    int64                `json:"reply_count"`
	Status        string               `json:"status"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	MentionCount  int64                `json:"mention_count"`
	HasAttachment bool                 `json:"has_attachment"`
	MentionMe     bool                 `json:"mention_me"`
	Mentions      []MentionResponse    `json:"mentions,omitempty"`
	Attachments   []AttachmentResponse `json:"attachments,omitempty"`
	IsAuthor      bool                 `json:"is_author"`
	LikedByMe     bool                 `json:"liked_by_me"`
	DislikedByMe  bool                 `json:"disliked_by_me"`
}

type CommentItem struct {
	ID           int64     `json:"id,string"`
	MemberID     int64     `json:"-"`
	Content      string    `json:"content"`
	Likes        int64     `json:"likes"`
	Dislikes     int64     `json:"dislikes"`
	ParentID     int64     `json:"parent_id,string"`
	ReplyCount   int64     `json:"reply_count"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	MentionCount int64     `json:"mention_count"`
	LikedByMe    bool      `json:"liked_by_me"`
	DislikedByMe bool      `json:"disliked_by_me"`
}

type DeleteTaskCommentDTO struct {
	MemberID    int64 `validate:"required,gt=0"`                            // 用户ID
	TaskID      int64 `validate:"required,gt=0"`                            // 任务ID
	CommentID   int64 `validate:"required,gt=0"`                            // 评论ID
	WorkspaceID int64 `json:"workspace_id,string" validate:"required,gt=0"` // 工作空间ID
}
