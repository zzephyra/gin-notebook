package workspace

import (
	"gin-notebook/internal/pkg/dto"
	"time"

	"github.com/gin-gonic/gin"
)

type WorkspaceDTO struct {
	ID            int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Name          string    `json:"name" gorm:"not null; index:idx_name"`
	Description   string    `json:"description" gorm:"default:NULL"`
	Owner         int64     `json:"owner" gorm:"not null; index:idx_owner"`
	OwnerNickname string    `json:"owner_name" gorm:"default:NULL"`
	OwnerAvatar   string    `json:"owner_avatar" gorm:"default:NULL"`
	OwnerEmail    string    `json:"owner_email" gorm:"default:NULL"`
	AllowInvite   bool      `json:"allow_invite" gorm:"default:true"`
	AllowJoin     bool      `json:"allow_join" gorm:"default:true"`
	AllowPublic   bool      `json:"allow_public" gorm:"default:true"`
	AllowShare    bool      `json:"allow_share" gorm:"default:true"`
	AllowComment  bool      `json:"allow_comment" gorm:"default:true"`
	CreatedAt     time.Time `json:"created_at" gorm:"not null;autoCreateTime" time_format:"2006-01-02"`
}

func WorkspaceListSerializer(c *gin.Context, workspace *[]dto.WorkspaceListDTO) []WorkspaceDTO {
	workspaces := make([]WorkspaceDTO, len(*workspace))
	for i, w := range *workspace {
		workspaces[i] = WorkspaceDTO{
			ID:            w.ID,
			Name:          w.Name,
			Description:   w.Description,
			Owner:         w.Owner,
			OwnerNickname: w.OwnerNickname,
			OwnerEmail:    w.OwnerEmail,
			OwnerAvatar:   w.OwnerAvatar,
			AllowInvite:   w.AllowInvite,
			AllowJoin:     w.AllowJoin,
			AllowPublic:   w.AllowPublic,
			AllowShare:    w.AllowShare,
			AllowComment:  w.AllowComment,
			CreatedAt:     w.CreatedAt,
		}
	}
	return workspaces
}

func WorkspaceSerializer(c *gin.Context, workspace *dto.WorkspaceListDTO) WorkspaceDTO {
	return WorkspaceDTO{
		ID:            workspace.ID,
		Name:          workspace.Name,
		Description:   workspace.Description,
		Owner:         workspace.Owner,
		OwnerNickname: workspace.OwnerNickname,
		OwnerEmail:    workspace.OwnerEmail,
		OwnerAvatar:   workspace.OwnerAvatar,
		AllowInvite:   workspace.AllowInvite,
		AllowJoin:     workspace.AllowJoin,
		AllowPublic:   workspace.AllowPublic,
		AllowShare:    workspace.AllowShare,
		AllowComment:  workspace.AllowComment,
	}
}
