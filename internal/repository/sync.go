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

func (r *syncRepository) GetNoteSyncByID(ctx context.Context, syncID int64) (model.NoteExternalLink, error) {
	var syncModel model.NoteExternalLink
	err := r.db.WithContext(ctx).First(&syncModel, syncID).Error
	return syncModel, err
}

func (r *syncRepository) DeleteSyncByID(ctx context.Context, syncID int64, noteID int64) error {
	sql := r.db.WithContext(ctx).Where("id = ? AND note_id = ?", syncID, noteID).Unscoped().Delete(&model.NoteExternalLink{})

	if sql.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	if sql.Error != nil {
		return sql.Error
	}

	return nil
}

func (r *syncRepository) DeleteSyncOutbox(ctx context.Context, linkID int64) error {
	sql := r.db.WithContext(ctx).Where("link_id = ?", linkID).Unscoped().Delete(&model.SyncOutbox{})

	if sql.Error != nil {
		return sql.Error
	}

	return nil
}

func (r *syncRepository) CreateSyncOutboxs(ctx context.Context, outbox *[]model.SyncOutbox) error {
	sql := r.db.WithContext(ctx).Create(outbox)

	if err := sql.Error; err != nil {
		return err
	}
	return nil
}

func (r *syncRepository) GetBlockMappingByBlockIDs(ctx context.Context, nodeID int64, provider *model.IntegrationProvider, nodeUID *[]string) (*[]model.NoteExternalNodeMapping, error) {
	var mappings []model.NoteExternalNodeMapping
	query := r.db.WithContext(ctx).Where("note_id = ?", nodeID)
	if provider != nil {
		query = query.Where("provider = ?", *provider)
	}
	if nodeUID != nil && len(*nodeUID) > 0 {
		query = query.Where("node_uid IN ?", *nodeUID)
	}

	if err := query.Debug().Find(&mappings).Error; err != nil {
		return nil, err
	}

	return &mappings, nil
}

func (r *syncRepository) GetSequenceSynOutbox(ctx context.Context, linkID int64, status *model.SyncStatus, version *int64) (model.SyncOutbox, error) {
	var outboxs model.SyncOutbox
	sql := r.db.WithContext(ctx).
		Where("link_id = ?", linkID).
		Order("id ASC")

	if status != nil {
		sql = sql.Where("status = ?", *status)
	}

	if version != nil {
		sql = sql.Where("note_version = ?", *version)
	}

	sql = sql.Take(&outboxs)
	if err := sql.Error; err != nil {
		return outboxs, err
	}
	return outboxs, nil
}

func (r *syncRepository) UpdateSyncOutboxByID(ctx context.Context, db *gorm.DB, outboxID int64, status *model.SyncStatus, data map[string]interface{}) error {
	sql := db.Model(&model.SyncOutbox{}).
		Where("id = ?", outboxID).Debug()

	if status != nil {
		sql = sql.Where("status = ?", *status)
	}

	sql = sql.Updates(data)
	if sql.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return sql.Error
}
