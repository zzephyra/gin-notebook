package repository

import (
	"context"
	"errors"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/errorsx"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type syncRepository struct {
	db *gorm.DB
}

func NewSyncRepository(db *gorm.DB) *syncRepository {
	return &syncRepository{db: db}
}

func (r *syncRepository) CreateOrUpdateNoteSyncPolicy(ctx context.Context, policy *model.NoteExternalLink) error {
	// 首先查询是否存在相同的 target_note_id 且仍处于激活状态的记录
	var existing model.NoteExternalLink
	err := r.db.WithContext(ctx).
		Where("provider = ? AND res_type = ? AND target_note_id = ? AND is_active = TRUE",
			policy.Provider, policy.ResType, policy.TargetNoteID).
		First(&existing).Error

	if err == nil {
		// 找到了已有绑定
		if existing.NoteID != policy.NoteID {
			return errorsx.ErrNoteSyncConflict
		}
		// 如果是同一个 Note，可以允许更新参数
		return r.db.WithContext(ctx).Model(&existing).Updates(map[string]any{
			"mode":            policy.Mode,
			"direction":       policy.Direction,
			"conflict_policy": policy.ConflictPolicy,
			"is_active":       policy.IsActive,
			"updated_at":      time.Now(),
		}).Error
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 没有冲突，直接创建新记录
		return r.db.WithContext(ctx).Create(policy).Error
	}

	// 其他数据库错误
	return err
}

func (r *syncRepository) CreateOutboxEvent(ctx context.Context, event *model.OutboxEvent) error {
	if err := r.db.WithContext(ctx).Create(event).Error; err != nil {
		return err
	}
	return nil
}

func (r *syncRepository) UpsertNoteExternalNodeMappings(ctx context.Context, nodeMappings *[]model.NoteExternalNodeMapping) error {
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "note_id"}, {Name: "provider"}, {Name: "external_block_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
	}).Create(nodeMappings).Error
}
