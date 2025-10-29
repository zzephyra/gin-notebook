// repository/task_repo.go
package repository

import (
	"context"
	"gin-notebook/internal/model"

	"gorm.io/gorm"
)

type TaskRepo struct {
	db  *gorm.DB
	ctx context.Context
}

func NewTaskRepo(db *gorm.DB, ctx context.Context) *TaskRepo { return &TaskRepo{db: db, ctx: ctx} }

func (r *TaskRepo) Create(t *model.ScheduledTask) error {
	return r.db.Create(t).Error
}

func (r *TaskRepo) GetByID(id uint) (*model.ScheduledTask, error) {
	var t model.ScheduledTask
	if err := r.db.First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepo) Update(t *model.ScheduledTask) error {
	return r.db.Save(t).Error
}
