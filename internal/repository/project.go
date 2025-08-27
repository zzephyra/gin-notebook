package repository

import (
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func CreateProjectTask(db *gorm.DB, taskModel *model.ToDoTask) error {
	err := db.Create(taskModel).Error
	return err
}

func GetLatestOrderByColumnID(db *gorm.DB, columnID int64, withLock bool) (string, error) {
	var maxOrder string

	sql := db.Model(&model.ToDoTask{})

	if withLock {
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

func GetProjectTasksByColumns(db *gorm.DB, columnIDs []int64, limitPerColumn int) ([]dto.ToDoTaskWithFlag, error) {
	if limitPerColumn <= 0 {
		limitPerColumn = 50 // 默认每列获取50条任务
	}

	var orderTag string
	if database.IsPostgres() {
		orderTag = `order_index COLLATE "C"`
	} else {
		orderTag = "" // 使用默认排序，或者拓展其他数据库
	}

	var tasks []dto.ToDoTaskWithFlag
	query := fmt.Sprintf(`
		WITH ranked_tasks AS (
			SELECT *,
				ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY %s ASC) AS rn,
				COUNT(*) OVER (PARTITION BY column_id) AS total_count
			FROM to_do_tasks
			WHERE column_id IN (?)
		)
		SELECT *
		FROM ranked_tasks
		WHERE rn <= ?;
	`, orderTag)

	err := db.Debug().Raw(query, columnIDs, limitPerColumn).Scan(&tasks).Error
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

func GetProjectTaskByID(db *gorm.DB, taskID int64) (*model.ToDoTask, error) {
	var task model.ToDoTask
	err := db.Where("id = ?", taskID).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func GetProjectTaskByIDs(db *gorm.DB, taskID []int64, columnID int64, withLock bool) ([]model.ToDoTask, error) {
	var task []model.ToDoTask
	sql := db.Model(&model.ToDoTask{}).
		Where("id IN ? AND column_id = ?", taskID, columnID).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "order_index"}})

	if withLock {
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

func UpdateTaskByTaskID(db *gorm.DB, taskID int64, data map[string]interface{}) error {
	db.Model(&model.ToDoTask{}).
		Where("id = ?", taskID).
		Updates(data)
	return db.Error
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
