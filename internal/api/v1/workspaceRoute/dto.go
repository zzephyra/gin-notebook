package workspaceRoute

import (
	"encoding/json"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type WorkspaceDTO struct {
	ID           int64     `json:"id,string"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	MemberID     int64     `json:"member_id,string"`
	AllowInvite  bool      `json:"allow_invite"`
	AllowJoin    bool      `json:"allow_join"`
	AllowPublic  bool      `json:"allow_public"`
	AllowShare   bool      `json:"allow_share"`
	AllowComment bool      `json:"allow_comment"`
	CreatedAt    time.Time `json:"created_at"`
	Roles        []string  `json:"roles"`
	Editable     bool      `json:"editable"`
	Avatar       string    `json:"avatar"`
	MemberCount  int       `json:"memberCount"`
}

type RecommendNoteCategoryDTO struct {
	Hot    []model.NoteCategory `json:"hot"`
	Recent []model.NoteCategory `json:"recent"`
}

func WorkspaceListSerializer(c *gin.Context, workspace *[]dto.WorkspaceListDTO) []WorkspaceDTO {
	workspaces := make([]WorkspaceDTO, len(*workspace))
	for i, w := range *workspace {
		workspaces[i] = WorkspaceDTO{
			ID:           w.ID,
			Name:         w.Name,
			Description:  w.Description,
			MemberID:     w.MemberID,
			AllowInvite:  w.AllowInvite,
			AllowJoin:    w.AllowJoin,
			AllowPublic:  w.AllowPublic,
			AllowShare:   w.AllowShare,
			AllowComment: w.AllowComment,
			CreatedAt:    w.CreatedAt,
		}
	}
	return workspaces
}

func WorkspaceSerializer(c *gin.Context, workspace *dto.WorkspaceDTO) WorkspaceDTO {
	roles := make([]string, 0)
	json.Unmarshal(workspace.Roles, &roles)

	return WorkspaceDTO{
		ID:           workspace.ID,
		Name:         workspace.Name,
		Description:  workspace.Description,
		AllowInvite:  workspace.AllowInvite,
		AllowJoin:    workspace.AllowJoin,
		AllowPublic:  workspace.AllowPublic,
		AllowShare:   workspace.AllowShare,
		AllowComment: workspace.AllowComment,
		Roles:        roles,
		Editable:     workspace.Editable,
		Avatar:       workspace.Avatar,
		MemberCount:  workspace.MemberCount,
		MemberID:     workspace.MemberID,
	}
}

func WorkspaceNoteSerializer(c *gin.Context, note *dto.CreateWorkspaceNoteDTO) *dto.WorkspaceNoteDTO {
	var content = []dto.NoteBlockDTO{}
	if note.Content != nil {
		content = *note.Content
	}

	return &dto.WorkspaceNoteDTO{
		ID:           *note.ID,
		Title:        note.Title,
		Content:      content,
		WorkspaceID:  note.WorkspaceID,
		CategoryID:   note.CategoryID,
		AllowEdit:    *note.AllowEdit,
		AllowComment: *note.AllowComment,
		AllowShare:   *note.AllowShare,
		Status:       string(*note.Status),
		AllowJoin:    *note.AllowJoin,
		AllowInvite:  *note.AllowInvite,
		OwnerID:      note.OwnerID,
		OwnerName:    *c.MustGet("nickname").(*string),
		OwnerAvatar:  c.MustGet("avatar").(string),
		OwnerEmail:   c.MustGet("email").(string),
	}
}

func RecommendNoteCategorySerializer(c *gin.Context, noteCategory *dto.RecommendNoteCategoryDTO) {
	var hotMap = make(map[int64]bool)
	if noteCategory.Hot != nil {
		for _, v := range *noteCategory.Hot {
			hotMap[v.ID] = true
		}
	}

	var recentSlice = *noteCategory.Recent
	var index = 0

	if noteCategory.Recent != nil {
		for _, v := range *noteCategory.Recent {
			if !hotMap[v.ID] {
				recentSlice[index] = v
				index++
			}
		}
	}
	*noteCategory.Recent = recentSlice[:index]
}

func WorkspaceLinkListSerializer(c *gin.Context, workspaceLink *[]model.WorkspaceInvite) []map[string]interface{} {
	links := make([]map[string]interface{}, len(*workspaceLink))
	for i, w := range *workspaceLink {
		links[i] = WorkspaceLinkSerializer(c, &w)
	}
	return links
}

func WorkspaceLinkSerializer(c *gin.Context, workspaceLink *model.WorkspaceInvite) map[string]interface{} {
	var isExpired = false
	expiredAt := workspaceLink.ExpiresAt
	if expiredAt != nil {
		isExpired = (*expiredAt).Before(time.Now())
	}

	links := map[string]interface{}{
		"id":          strconv.FormatInt(workspaceLink.ID, 10),
		"uuid":        workspaceLink.UUID,
		"expire_time": expiredAt,
		"is_expired":  isExpired,
		"count":       workspaceLink.Count,
	}
	return links
}
