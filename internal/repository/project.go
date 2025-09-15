package repository

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	CommentLikeActionInsert = "insert"
	CommentLikeActionSwitch = "switch"
	CommentLikeActionNoop   = "noop"
)

func CreateProjectTask(db *gorm.DB, taskModel *model.ToDoTask) error {
	err := db.Create(taskModel).Error
	return err
}

func GetLatestOrderByColumnID(db *gorm.DB, columnID int64, opts ...DatabaseExtraOpt) (string, error) {
	var maxOrder string
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}
	sql := db.Model(&model.ToDoTask{})

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	err := sql.Where("column_id = ?", columnID).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "order_index"}, Desc: true}).
		Limit(1).
		Select("order").
		Scan(&maxOrder).Error

	if err != nil {
		return "", err
	}
	return maxOrder, nil
}

func CreateProjectTaskAssignees(db *gorm.DB, assigneeModel *[]model.ToDoTaskAssignee) error {
	return db.Create(assigneeModel).Error
}

func GetProjectsByWorkspaceID(db *gorm.DB, workspaceID int64) ([]model.Project, error) {
	var projects []model.Project
	err := db.Where("workspace_id = ?", workspaceID).Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}

func ProjectExistsByID(db *gorm.DB, projectID int64, workspaceID int64) (bool, error) {
	var count int64
	err := db.Model(&model.Project{}).Where("id = ? AND workspace_id = ?", projectID, workspaceID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func GetProjectColumnsByProjectID(db *gorm.DB, projectID int64) ([]model.ToDoColumn, error) {
	var columns []model.ToDoColumn
	err := db.Where("project_id = ?", projectID).Find(&columns).Error
	if err != nil {
		return nil, err
	}
	return columns, nil
}

// 按列分页：每个 column_id 各自取 [offset, offset+limit) 这段
func GetProjectTasksByColumns(db *gorm.DB, columnIDs []int64, limit, offset int) ([]dto.ToDoTaskWithFlag, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// 统一生成 LexoRank 的排序表达式（按字节序 + id 兜底）
	getOrderExpr := func() string {
		switch {
		case database.IsPostgres():
			return `order_index COLLATE "C" ASC, id ASC`
		case database.IsMysql():
			return `order_index COLLATE ascii_bin ASC, id ASC` // 若列定义已是 *_bin，可简化为 order_index ASC, id ASC
		default:
			return `order_index ASC, id ASC`
		}
	}

	orderExpr := getOrderExpr()

	query := fmt.Sprintf(`
		WITH ranked AS (
			SELECT
				t.*,
				ROW_NUMBER() OVER (PARTITION BY t.column_id ORDER BY %s) AS rn,
				COUNT(*)    OVER (PARTITION BY t.column_id) AS total_count
			FROM to_do_tasks AS t
			WHERE t.deleted_at IS NULL
			  AND t.column_id IN (?)
		)
		SELECT *
		FROM ranked
		WHERE rn > ? AND rn <= ?;
	`, orderExpr)

	var tasks []dto.ToDoTaskWithFlag
	if err := db.Raw(query, columnIDs, offset, offset+limit).Scan(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func GetProjectTaskByID(db *gorm.DB, taskID int64, opts ...DatabaseExtraOpt) (*model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task model.ToDoTask
	sql := db.Where("id = ?", taskID)

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	if err := sql.First(&task).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func GetProjectTaskByIDs(db *gorm.DB, taskID []int64, opts ...DatabaseExtraOpt) ([]model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task []model.ToDoTask
	sql := db.Model(&model.ToDoTask{}).
		Where("id IN ?", taskID).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "order_index"}})

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := sql.Scan(&task).Error
	if err != nil {
		return nil, err
	}
	return task, nil
}

func GetProjectTaskAssigneesByTaskIDs(db *gorm.DB, taskIDs []int64) ([]dto.ToDoTaskAssignee, error) {
	var assignees []dto.ToDoTaskAssignee

	err := db.Model(&model.ToDoTaskAssignee{}).
		Select("to_do_task_assignees.to_do_task_id, u.nickname, u.email AS email, wm.id, u.avatar, wm.nickname as workspace_nickname").
		Joins("JOIN workspace_members wm ON wm.id = to_do_task_assignees.assignee_id").
		Joins("JOIN users u ON u.id =  wm.user_id").
		Where("to_do_task_assignees.to_do_task_id IN ?", taskIDs).Scan(&assignees).Error
	if err != nil {
		return nil, err
	}

	return assignees, nil
}

func UpdateTaskByTaskID(
	db *gorm.DB, taskID int64, ifMatchUpdatedAt time.Time, data map[string]interface{},
) (task *model.ToDoTask, err error, conflicted bool) {
	data["updated_at"] = gorm.Expr("NOW()")

	res := db.Model(&model.ToDoTask{}).
		Where("id = ? AND updated_at = ?", taskID, ifMatchUpdatedAt).
		Updates(data)

	if res.Error != nil {
		return nil, res.Error, false
	}
	if res.RowsAffected == 0 {
		var t model.ToDoTask
		if err := db.Select("id, updated_at").First(&t, taskID).Error; err != nil {
			return nil, err, true
		}
		return &t, nil, true
	}
	var t model.ToDoTask
	if err := db.First(&t, taskID).Error; err != nil {
		return nil, err, false
	}
	return &t, nil, false
}

func RemoveTaskAssigneesByTaskIDAndMemberIDs(db *gorm.DB, taskID int64, memberIDs []int64) error {
	// 由于设置了联合唯一索引，为了兼容MySQL和PostgreSQL，这里采用硬删除
	if len(memberIDs) == 0 {
		return nil // 如果没有用户ID，直接返回
	}
	return db.Unscoped().Where("to_do_task_id = ? AND assignee_id IN ?", taskID, memberIDs).Delete(&model.ToDoTaskAssignee{}).Error
}

func CheckWorkspaceMemberAuth(db *gorm.DB, workspaceID, userID, memberID int64) (bool, error) {
	var count int64
	err := db.Model(&model.WorkspaceMember{}).
		Where("workspace_id = ? AND user_id = ? AND id = ?", workspaceID, userID, memberID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func DeleteProjectColumnTasksByID(db *gorm.DB, columnID, projectID int64, hard bool) error {
	sql := db.Where("column_id = ? AND project_id = ?", columnID, projectID).Delete(&model.ToDoTask{})

	if hard {
		sql = sql.Unscoped()
	}

	return sql.Error
}

func GetLastTask(db *gorm.DB, columnID int64, opts ...DatabaseExtraOpt) (*model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task model.ToDoTask
	sql := db.Where("column_id = ?", columnID).
		Order(GetLexoRankOrderExpr(true)).
		Limit(1).
		First(&task)

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	if sql.Error != nil {
		return nil, sql.Error
	}
	return &task, nil
}

func GetLexoRankOrderExpr(desc bool) string {
	var dir string
	if desc {
		dir = "DESC"
	} else {
		dir = "ASC"
	}

	switch {
	case database.IsPostgres():
		return fmt.Sprintf(`order_index COLLATE "C" %s, id %s`, dir, dir)
	case database.IsMysql():
		// 如果列本身是 ascii_bin/utf8mb4_bin，可以直接 order_index %s
		return fmt.Sprintf(`order_index COLLATE ascii_bin %s, id %s`, dir, dir)
	default:
		return fmt.Sprintf(`order_index %s, id %s`, dir, dir)
	}
}

func UpdateProjectColumnByID(db *gorm.DB, columnID int64, ifMatchUpdatedAt time.Time, data map[string]interface{}) (column *model.ToDoColumn, err error, conflicted bool) {
	data["updated_at"] = gorm.Expr("NOW()")

	res := db.Model(&model.ToDoColumn{}).
		Where("id = ? AND updated_at = ?", columnID, ifMatchUpdatedAt).
		Updates(data)

	if res.Error != nil {
		return nil, res.Error, false
	}
	if res.RowsAffected == 0 {
		var c model.ToDoColumn
		if err := db.Select("id, updated_at").First(&c, columnID).Error; err != nil {
			return nil, err, true
		}
		return &c, nil, true
	}
	var c model.ToDoColumn
	if err := db.First(&c, columnID).Error; err != nil {
		return nil, err, false
	}
	return &c, nil, false
}

func GetProjectTaskActivitiesByTaskID(db *gorm.DB, taskID int64, limit, offset int, start, end *time.Time) ([]dto.KanbanActivityDTO, int64, error) {
	var activities []dto.KanbanActivityDTO

	if offset < 0 {
		offset = 0
	}
	if limit <= 0 || limit > 30 {
		limit = 20
	}

	sql := db.
		Model(&model.KanbanActivity{}).
		Debug().
		Where("task_id = ? AND success = true", taskID).
		Joins("LEFT JOIN workspace_members wm ON wm.id = kanban_activity.member_id").
		Joins("LEFT JOIN users u ON u.id = wm.user_id").
		Select("kanban_activity.*, u.nickname AS user_nickname, wm.nickname AS member__nickname, u.avatar as avatar, u.email as email").
		Order("created_at DESC")

	if start != nil {
		sql = sql.Where("kanban_activity.created_at >= ?", start.UTC())
	}
	if end != nil {
		sql = sql.Where("kanban_activity.created_at <= ?", end.UTC())
	}

	var total int64
	if err := sql.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sql = sql.Offset(offset).Limit(limit)

	if err := sql.Find(&activities).Error; err != nil {
		return nil, 0, err
	}
	return activities, total, nil
}

func GetTaskCommentLikeByMemberID(db *gorm.DB, commentID, memberID int64) *model.ToDoCommentLike {
	var memberLikeModel = model.ToDoCommentLike{}
	err := db.Model(&model.ToDoCommentLike{}).
		Where("comment_id = ? AND member_id = ?", commentID, memberID).
		Find(&memberLikeModel).Error
	if err != nil {
		return nil
	}
	return &memberLikeModel
}

func CreateOrUpdateCommentLike(db *gorm.DB, likeModel *model.ToDoCommentLike) (string, error) {
	// Step 1: 尝试插入（冲突则 DoNothing）
	res := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "comment_id"}, {Name: "member_id"}},
		DoNothing: true,
	}).Create(likeModel)

	if res.Error != nil {
		return "", res.Error
	}
	if res.RowsAffected == 1 {
		return CommentLikeActionInsert, nil
	}

	// Step 2: 尝试恢复软删记录
	restore := db.Model(&model.ToDoCommentLike{}).
		Unscoped().
		Where("comment_id = ? AND member_id = ? AND (deleted_at IS NOT NULL OR is_like <> ?)", likeModel.CommentID, likeModel.MemberID, likeModel.IsLike).
		Updates(map[string]any{
			"is_like":    likeModel.IsLike,
			"deleted_at": nil,
			"updated_at": gorm.Expr("NOW()"),
		})

	if restore.Error != nil {
		return "", restore.Error
	}
	if restore.RowsAffected == 1 {
		return CommentLikeActionSwitch, nil
	}

	// Step 4: 同值重复点击 → noop
	return CommentLikeActionNoop, nil
}

func IncCommentCounters(db *gorm.DB, commentID int64, dLikes, dDislikes int) (data *dto.LikeCommentDTO, err error) {
	out := dto.LikeCommentDTO{}
	err = db.Model(&model.ToDoTaskComment{}).
		Where("id = ?", commentID).
		Updates(map[string]any{
			"likes":      gorm.Expr("GREATEST(likes + ?, 0)", dLikes),
			"dislikes":   gorm.Expr("GREATEST(dislikes + ?, 0)", dDislikes),
			"updated_at": gorm.Expr("NOW()"),
		}).Error

	if err == nil {
		err = db.Model(&model.ToDoTaskComment{}).
			Select("likes", "dislikes").
			Where("id = ?", commentID).
			Scan(&out).Error
	}
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func DeleteCommentLike(db *gorm.DB, commentID, memberID int64) (string, error) {
	var like model.ToDoCommentLike
	if err := db.Where("comment_id = ? AND member_id = ?", commentID, memberID).First(&like).Error; err != nil {
		return "", err
	}

	// 软删除
	if err := db.Delete(&like).Error; err != nil {
		return "", err
	}

	// 返回动作类型，方便调用层更新计数
	if like.IsLike {
		return "unlike", nil
	}
	return "undislike", nil
}

func DeleteProjectTaskByID(db *gorm.DB, taskID, workspaceID, memberID int64) error {
	// 软删除任务
	task := &model.ToDoTask{
		BaseModel: model.BaseModel{
			ImmutableBaseModel: model.ImmutableBaseModel{
				ID: taskID,
			},
		},
	}
	err := DeleteModel(db, task)
	if err != nil {
		return err
	}
	return nil
}
