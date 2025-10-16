package repository

import (
	"context"
	"gin-notebook/internal/model"

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
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "note_id"}, {Name: "provider"}},
		DoUpdates: clause.AssignmentColumns([]string{"target_note_id", "mode", "direction", "conflict_policy", "is_active", "updated_at"}),
	}).Create(policy).Error; err != nil {
		return err
	}
	return nil
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
