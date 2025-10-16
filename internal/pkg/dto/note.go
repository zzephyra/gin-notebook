package dto

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/pkg/utils/tools"
	"reflect"
	"time"

	"gorm.io/datatypes"
)

type NoteBlockDTO struct {
	ID       string         `json:"id"`       // 建议前端传稳定ID；没有也可留空，后端生成
	Type     string         `json:"type"`     // "paragraph" | "heading" | ...
	Props    BlockPropsDTO  `json:"props"`    // 见下
	Content  []InlineDTO    `json:"content"`  // 文本 runs
	Children []NoteBlockDTO `json:"children"` // 允许嵌套
}
type BlockPropsDTO struct {
	BackgroundColor *string `json:"backgroundColor"`        // "default" | "#rrggbb" ...
	TextColor       *string `json:"textColor"`              // 同上
	TextAlignment   *string `json:"textAlignment"`          // "left" | "center" | "right"
	Level           *int    `json:"level,omitempty"`        // 仅 heading 生效
	IsToggleable    *bool   `json:"isToggleable,omitempty"` // 仅 heading 可折叠
	Caption         *string `json:"caption,omitempty"`      // 仅 image 生效
	Name            *string `json:"name,omitempty"`         // 仅 image 生效
	ShowPreview     *bool   `json:"showPreview,omitempty"`  // 仅 link_preview 生效
	Url             *string `json:"url,omitempty"`          // 仅 link_preview 生效
}

func (p *BlockPropsDTO) Update(data *BlockPropsDTO) {
	if data == nil {
		return
	}
	dv := reflect.ValueOf(p).Elem()
	pv := reflect.ValueOf(data).Elem()

	for i := 0; i < dv.NumField(); i++ {
		pf := pv.Field(i)
		df := dv.Field(i)

		// 仅当 patch 对应字段非 nil 时才更新
		if pf.Kind() == reflect.Ptr && !pf.IsNil() {
			df.Set(pf)
		}
	}
}

type InlineDTO struct {
	Type   string                 `json:"type"`
	Text   string                 `json:"text"`
	Styles map[string]interface{} `json:"styles"`
}

type Blocks []NoteBlockDTO

func (b *Blocks) Scan(value any) error { // db -> Go
	switch v := value.(type) {
	case []byte:
		if len(v) == 0 {
			*b = nil
			return nil
		}
		return json.Unmarshal(v, b)
	case string:
		if v == "" {
			*b = nil
			return nil
		}
		return json.Unmarshal([]byte(v), b)
	default:
		return fmt.Errorf("unsupported Scan type %T for Blocks", value)
	}
}
func (b Blocks) Value() (driver.Value, error) { // Go -> db
	if b == nil {
		return []byte("null"), nil
	}
	return json.Marshal(b)
}

type WorkspaceNoteDTO struct {
	ID           int64     `json:"id,string"`
	Title        string    `json:"title" validate:"required,min=1,max=100"`
	Content      Blocks    `json:"content"`
	WorkspaceID  int64     `json:"workspace_id,string" validate:"required"`
	CategoryID   int64     `json:"category_id,string" validate:"required"`
	AllowEdit    bool      `json:"allow_edit"`
	AllowComment bool      `json:"allow_comment"`
	AllowShare   bool      `json:"allow_share"`
	Status       string    `json:"status" validate:"omitempty,oneof=public private"`
	AllowJoin    bool      `json:"allow_join"`
	AllowInvite  bool      `json:"allow_invite"`
	OwnerID      int64     `json:"owner_id,string"`
	OwnerName    string    `json:"owner_name"`
	OwnerAvatar  string    `json:"owner_avatar"`
	OwnerEmail   string    `json:"owner_email"`
	IsFavorite   bool      `json:"is_favorite"` // 是否收藏
	CreatedAt    time.Time `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt    time.Time `json:"updated_at" time_format:"2006-01-02"`
	CategoryName string    `json:"category_name"`
	Cover        *string   `json:"cover"` // 笔记封面
}

type WorkspaceUpdateNoteCategoryDTO struct {
	ID           int64  `json:"id,string"`
	CategoryName string `json:"category_name"`
	Total        int64  `json:"total"`
}

type UpdateWorkspaceNoteValidator struct {
	WorkspaceID  int64      `json:"workspace_id,string" validate:"required,gt=0"`
	OwnerID      int64      `json:"owner_id,string" validate:"required,gt=0"`
	NoteID       int64      `json:"note_id,string" validate:"required"`
	Actions      *[]PatchOp `json:"actions" validate:"required,dive"`
	Title        *string    `json:"title" validate:"omitempty,min=1,max=100"`
	Content      *Blocks    `json:"content"`
	CategoryID   *int64     `json:"category_id,string"`
	AllowEdit    *bool      `json:"allow_edit"`
	AllowComment *bool      `json:"allow_comment"`
	AllowShare   *bool      `json:"allow_share"`
	Status       *string    `json:"status"`
	AllowJoin    *bool      `json:"allow_join"`
	AllowInvite  *bool      `json:"allow_invite"`
	Cover        *string    `json:"cover" validate:"omitempty,url"` // 笔记封面
	UpdatedAt    string     `json:"updated_at"`                     // 前端传回的更新时间（协作冲突控制）
}

type CreateWorkspaceNoteDTO struct {
	BaseDto
	WorkspaceID  int64             `json:"workspace_id,string" validate:"required,gt=0"`
	OwnerID      int64             `json:"owner_id,string" validate:"required,gt=0"`
	Title        string            `json:"title" validate:"min=1,max=100"`
	Content      *Blocks           `json:"content"`
	CategoryID   int64             `json:"category_id,string" validate:"required,gt=0"`
	AllowEdit    *bool             `json:"allow_edit"`
	AllowComment *bool             `json:"allow_comment"`
	AllowShare   *bool             `json:"allow_share"`
	Status       *model.NoteStatus `json:"status" validate:"omitempty,oneof=private public group"` // 限制状态值范围
	AllowJoin    *bool             `json:"allow_join"`
	AllowInvite  *bool             `json:"allow_invite"`
}

func (dto *CreateWorkspaceNoteDTO) ToModel(ignoredFields []string) *model.Note {
	note := &model.Note{}
	tools.CopyFields(dto, note, append(ignoredFields, "Status"))
	if dto.Status != nil && !tools.Contains(ignoredFields, "Status") {
		note.Status = model.NoteStatus(*dto.Status)
	}
	var contentJSON datatypes.JSON
	if dto.Content == nil || len(*dto.Content) == 0 {
		contentJSON = tools.MustJSONBytes(DefaultBlocks())
	} else {
		contentJSON = tools.MustJSONBytes(*dto.Content)
	}
	note.Content = contentJSON

	return note
}

func (v *UpdateWorkspaceNoteValidator) ToUpdate() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, map[string]string{"Status": "status"}, []string{"NoteID", "Actions", "OwnerID", "UpdatedAt", "WorkspaceID"})
	if v.Status != nil {
		updates["status"] = model.NoteStatus(*v.Status)
	}

	return updates
}

type NoteCategoryBaseDTO struct {
	BaseDto
	WorkspaceID  *int64  `json:"workspace_id,string" validate:"omitempty,gt=0"`
	CategoryName *string `json:"category_name" validate:"required,min=1,max=20"`
}

func (v *NoteCategoryBaseDTO) ToMap() map[string]interface{} {
	updates := tools.StructToUpdateMap(v, nil, []string{"ID", "WorkspaceID", "CreatedAt", "UpdatedAt"})
	return updates
}

type UpdateNoteCategoryDTO struct {
	NoteCategoryBaseDTO
	ID int64 `json:"id,string" validate:"required,gt=0"`
}

type DeleteNoteCategoryDTO struct {
	OwnerID     *int64 `json:"owner_id,string"`
	ID          int64  `json:"note_id,string" validate:"required,gt=0"`
	WorkspaceID int64  `json:"workspace_id,string" validate:"required,gt=0"`
}

type CreateNoteCategoryDTO struct {
	BaseDto
	CategoryName string `json:"category_name" validate:"required,min=1,max=20"`
	WorkspaceID  int64  `json:"workspace_id,string" validate:"required"`
}

func (v *CreateNoteCategoryDTO) ToModel() *model.NoteCategory {
	return &model.NoteCategory{
		WorkspaceID:  v.WorkspaceID,
		CategoryName: v.CategoryName,
	}
}

type RecommendNoteCategoryQueryDTO struct {
	WorkspaceID int64 `form:"workspace_id,string" validate:"required"`
}

type RecommendNoteCategoryDTO struct {
	Hot    *[]model.NoteCategory `json:"hot"`
	Recent *[]model.NoteCategory `json:"recent"`
}

type NoteCategoryQueryDTO struct {
	WorkspaceID  int64  `form:"workspace_id,string" validate:"required"`
	CategoryName string `form:"kw" validate:"omitempty,min=1,max=20"`
}

type FavoriteNoteDTO struct {
	NoteID     int64 `json:"note_id,string" validate:"required,gt=0"`
	UserID     int64 `json:"user_id,string" validate:"required,gt=0"`
	IsFavorite *bool `json:"is_favorite" validate:"required"` // 是否收藏
	Sep        int64 `json:"sep" validate:"required,gt=0"`    // 收藏顺序
}

type FavoriteNoteQueryDTO struct {
	UserID      int64  `form:"user_id,string" validate:"required,gt=0"`
	WorkspaceID int64  `form:"workspace_id,string" validate:"required,gt=0"`
	Limit       int    `form:"limit" validate:"omitempty,gt=0"`
	Offset      int    `form:"offset" validate:"omitempty,gt=0,lt=30"`
	Order       string `form:"order" validate:"omitempty,oneof=asc desc"`                       // 排序方式
	OrderBy     string `form:"order_by" validate:"omitempty,oneof=title created_at updated_at"` // 排序字段
}

type FavoriteNoteListDTO struct {
	OwnerID        int64     `json:"owner_id,string"`
	OwnerNickame   string    `json:"owner_nickname"`
	OwnerEmail     string    `json:"owner_email"`
	OwnerAvatar    string    `json:"owner_avatar"`
	NoteTitle      string    `json:"note_title"`
	NoteID         int64     `json:"note_id,string"`
	NoteContent    string    `json:"note_content"`
	NoteCategory   string    `json:"note_category"`
	NoteCategoryID int64     `json:"note_category_id,string"`
	NoteTag        string    `json:"note_tag"`
	NoteTagID      int64     `json:"note_tag_id,string"`
	CreatedAt      time.Time `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt      time.Time `json:"updated_at" time_format:"2006-01-02"`
	IsFavorite     bool      `json:"is_favorite"` // 是否收藏
}

type CreateTemplateNoteDTO struct {
	OwnerID  int64   `validate:"required,gt=0"`
	Content  Blocks  `json:"content" validate:"required"`
	Title    string  `json:"title" validate:"required,min=1,max=100"`
	IsPublic *bool   `json:"is_public" validate:"omitempty"`
	Cover    *string `json:"cover" validate:"omitempty,url"`
}

type TemplateNote struct {
	ID        int64        `json:"id,string"`
	User      UserBreifDTO `json:"user"`
	Content   Blocks       `json:"content"`
	Title     string       `json:"title"`
	IsPublic  *bool        `json:"is_public"`
	Cover     *string      `json:"cover"`
	CreatedAt time.Time    `json:"created_at" time_format:"2006-01-02"`
	UpdatedAt time.Time    `json:"updated_at" time_format:"2006-01-02"`
}

type GetTemplateNotesDTO struct {
	UserID   int64   `validate:"required,gt=0"`
	Keywords *string `form:"keywords" validate:"omitempty,min=1,max=100"`
	OrderBy  *string `form:"order_by" validate:"omitempty,oneof=created_at updated_at title"`
	Limit    *int    `form:"limit" validate:"omitempty,gt=0,lt=20"`
	Offset   int     `form:"offset" validate:"omitempty,gte=0"`
}

type AddNoteSyncDTO struct {
	NoteID         int64                     `json:"note_id,string" validate:"required,gt=0"`
	WorkspaceID    int64                     `json:"workspace_id,string" validate:"required,gt=0"`
	Provider       model.IntegrationProvider `json:"provider" validate:"required,oneof=notion feishu"`
	Mode           model.SyncMode            `json:"mode" validate:"required,oneof=auto manual"`
	Direction      model.SyncDirection       `json:"direction" validate:"required,oneof=push pull both"`
	ConflictPolicy model.ConflictPolicy      `json:"conflict_policy" validate:"required,oneof=latest"`
	MemberID       int64                     `validate:"required,gt=0"`
	TargetNoteID   string                    `json:"target_note_id"`
}

type GetNoteSyncListDTO struct {
	NoteID      int64                      `form:"note_id,string" validate:"required,gt=0"`
	WorkspaceID int64                      `form:"workspace_id,string" validate:"required,gt=0"`
	Provider    *model.IntegrationProvider `form:"provider" validate:"omitempty,oneof=notion feishu"`
	MemberID    int64                      `form:"member_id,string" validate:"omitempty,gt=0"`
}

type PatchRequest struct {
	Ops         []PatchOp `json:"ops" binding:"required"`
	BaseVersion *int      `json:"base_version,omitempty"` // 可选：文档版本
}

type PatchOp struct {
	Op string `json:"op" binding:"required,oneof=insert update move delete"`

	// insert
	Block *NoteBlockDTO `json:"block,omitempty"`

	// update
	NodeUID string         `json:"node_uid,omitempty"`
	Patch   *PartialUpdate `json:"patch,omitempty"`

	// move
	NewParentUID *string `json:"new_parent_uid,omitempty"`
	AfterID      *string `json:"afterId,omitempty"`
	BeforeID     *string `json:"beforeId,omitempty"`

	// delete
	// 使用 NodeUID
}

type IncomingBlock struct {
	ID       string         `json:"id"` // BlockNote id → node_uid
	Type     string         `json:"type"`
	Props    map[string]any `json:"props"`
	Content  []InlineDTO    `json:"content"`
	ParentID string         `json:"parentId"`
	AfterID  *string        `json:"afterId,omitempty"`
	BeforeID *string        `json:"beforeId,omitempty"`
	Depth    *int           `json:"depth,omitempty"` // 仅 heading 用
}

type PartialUpdate struct {
	Type    *string        `json:"type,omitempty"`
	Props   *BlockPropsDTO `json:"props,omitempty"`
	Content *[]InlineDTO   `json:"content,omitempty"`
}
