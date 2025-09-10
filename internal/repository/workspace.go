package repository

import (
	"encoding/json"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"

	"gorm.io/gorm"
)

func GetWorkspaceListByUserID(UserID int64, start int, limit int) (*[]dto.WorkspaceListDTO, error) {
	var workspace []dto.WorkspaceListDTO
	err := database.DB.Table("workspaces").Select("workspaces.*, users.email AS owner_email").Joins("LEFT JOIN users ON users.id = workspaces.owner").Where("owner = ?", UserID).Offset(start).Limit(limit).Scan(&workspace).Error
	if err != nil {
		return nil, err
	}
	return &workspace, nil
}

func GetWorkspacePrivileges(workspaceID any, userID int64, fields string) (*[]model.WorkspaceMember, error) {
	if fields == "" {
		fields = "workspace_members.*"
	}

	var workspacePrivileges []model.WorkspaceMember
	err := database.DB.Table("workspace_members").Select(fields).Where("workspace_id = ? and user_id = ?", workspaceID, userID).Find(&workspacePrivileges).Error
	if err != nil {
		return nil, err
	}
	return &workspacePrivileges, nil
}

func CreateWorkspace(db *gorm.DB, workspace *model.Workspace) error {
	if db == nil {
		db = database.DB
	}
	result := db.Create(workspace)
	return result.Error
}

func CreateWorkspaceInviteLink(db *gorm.DB, inviteLink *model.WorkspaceInvite) error {
	if db == nil {
		db = database.DB
	}
	result := db.Create(inviteLink)
	return result.Error
}

func GetWorkspaceByID(workspaceID any, OwnerID int64) (*dto.WorkspaceDTO, error) {
	var workspace dto.WorkspaceDTO
	err := database.DB.Table("workspaces").
		Select(`
			workspaces.*, 
			users.email AS owner_email, 
			wm.id as member_id,
			wm.role as roles, 
			wm.nickname as nickname, 
			wm.editable as editable,
			wmc.member_cnt as member_count `).
		Debug().
		Joins("LEFT JOIN users ON users.id = workspaces.owner").
		Joins("LEFT JOIN workspace_members as wm on wm.workspace_id = workspaces.id and wm.user_id = ?", OwnerID).
		Joins(`LEFT JOIN (
			SELECT workspace_id, COUNT(*) AS member_cnt
			FROM   workspace_members
			GROUP  BY workspace_id
			) AS wmc
			ON wmc.workspace_id = workspaces.id`).
		Where("workspaces.id = ?", workspaceID).
		First(&workspace).Error
	if err != nil {
		return nil, err
	}
	roles := make([]string, 0)
	if err = json.Unmarshal([]byte(workspace.Roles), &roles); err != nil {
		logger.LogError(err, "获取工作区信息失败:")
	}

	fmt.Println("获取工作区信息:", roles)
	return &workspace, nil
}

func UpdateWorkspace(workspaceID any, workspace map[string]interface{}) error {
	fmt.Print(workspace)
	result := database.DB.Model(&model.Workspace{}).Where("id = ?", workspaceID).Updates(workspace)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("更新工作区数据失败")
	}
	return nil
}

func GetWorkspaceMember(userID int64, workspaceID int64) (*model.WorkspaceMember, error) {
	workspaceMember := model.WorkspaceMember{}
	tx := database.DB.Model(&model.WorkspaceMember{}).Where(&model.WorkspaceMember{WorkspaceID: workspaceID, UserID: userID}).First(&workspaceMember)
	if tx.Error != nil {
		return nil, tx.Error
	}

	return &workspaceMember, nil
}

func GetWorkspaceMembers(workspaceID int64, limit int, offset int, keywords string) (data *[]dto.WorkspaceMemberDTO, total int64, err error) {
	var workspaceMembers []dto.WorkspaceMemberDTO
	query := database.DB.Model(&model.WorkspaceMember{}).
		Select("workspace_members.id, workspace_members.role, workspace_members.user_id, workspace_members.nickname as workspace_nickname, u.avatar, u.email, u.nickname as user_nickname").
		Joins("LEFT JOIN users as u ON u.id = workspace_members.user_id").
		Where("workspace_id = ?", workspaceID)

	if keywords != "" {
		query = query.Where("workspace_members.nickname LIKE ? OR email LIKE ? OR u.nickname LIKE ?", "%"+keywords+"%", "%"+keywords+"%", "%"+keywords+"%")
	}

	count := int64(0)
	err = query.Count(&count).Error
	if err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	err = query.Find(&workspaceMembers).Error
	if err != nil {
		return nil, 0, err
	}
	return &workspaceMembers, count, nil
}

func GetWorkspaceMemberByIDs(memberID []int64) (workspaceMembers *[]dto.WorkspaceMemberDTO, err error) {
	query := database.DB.Model(&model.WorkspaceMember{}).
		Select("workspace_members.id, workspace_members.role, workspace_members.user_id, workspace_members.nickname as workspace_nickname, u.avatar, u.email, u.nickname as user_nickname").
		Joins("LEFT JOIN users as u ON u.id = workspace_members.user_id").
		Where("workspace_members.id in ?", memberID)

	err = query.Find(&workspaceMembers).Error
	if err != nil {
		return nil, err
	}
	return
}

func IsUserAllowedToModifyWorkspace(userID int64, workspaceID int64) (*model.WorkspaceMember, bool) {
	workspaceMember, err := GetWorkspaceMember(userID, workspaceID)
	if err != nil {
		return nil, false
	}
	roles := make([]string, 0)
	if err := json.Unmarshal(workspaceMember.Role, &roles); err != nil {
		return nil, false
	}
	return workspaceMember, tools.Contains(roles, model.MemberRole.Admin)
}

func GetWorkspaceLinks(workspaceID string) (*[]model.WorkspaceInvite, error) {
	var workspaceLinks []model.WorkspaceInvite
	err := database.DB.Table("workspace_invites").Select("workspace_invites.*").Where("workspace_id = ?", workspaceID).Find(&workspaceLinks).Error
	if err != nil {
		return nil, err
	}
	return &workspaceLinks, nil
}

func DeleteWorkspaceInviteLink(linkID string) error {
	result := database.DB.Where("id = ?", linkID).Delete(&model.WorkspaceInvite{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("删除工作区邀请链接失败")
	}
	return nil
}

func GetWorkspaceInviteLinkByID(linkUUID string) (*dto.WorkspaceInviteLinkDTO, error) {
	var inviteLink dto.WorkspaceInviteLinkDTO
	err := database.DB.Select("workspace_invites.*, workspaces.avatar as workspace_avatar, workspaces.allow_join, workspaces.name as workspace_name, workspaces.description as workspace_description").Table("workspace_invites").Joins("JOIN workspaces ON workspaces.id = workspace_invites.workspace_id").Where("uuid = ?", linkUUID).First(&inviteLink).Error
	if err != nil {
		return nil, err
	}
	return &inviteLink, nil
}

func IsInviteLinkMatchingWorkspace(linkUUID string, workspaceID int64) bool {
	var count int64
	err := database.DB.Model(&model.WorkspaceInvite{}).Where("workspace_id = ? and uuid = ?", workspaceID, linkUUID).Count(&count).Error
	if err != nil {
		return false
	}
	return count > 0
}
