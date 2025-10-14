package repository

import (
	"context"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IntegrationRepository interface {
	CreateIntegrationApp(ctx context.Context, params dto.IntegrationAppCreateDTO) error
	GetIntegrationAppList(ctx context.Context, provider *string) ([]model.IntegrationApp, error)
}

type integrationRepository struct {
	db *gorm.DB
}

func NewIntegrationRepository(db *gorm.DB) *integrationRepository {
	return &integrationRepository{db: db}
}

func (r *integrationRepository) CreateIntegrationApp(ctx context.Context, app *model.IntegrationApp) error {
	if err := r.db.WithContext(ctx).Create(app).Error; err != nil {
		return err
	}
	return nil
}

func (r *integrationRepository) BindIntegrationAccount(ctx context.Context, app *model.IntegrationAccount) error {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "provider"}},
		DoUpdates: clause.AssignmentColumns([]string{"access_token_enc", "refresh_token_enc", "access_token_expiry", "refresh_token_expiry", "scopes", "extra", "is_active"}),
	}).Create(app).Error; err != nil {
		return err
	}
	return nil
}

func (r *integrationRepository) GetIntegrationAppList(ctx context.Context, provider string) ([]model.IntegrationApp, error) {
	var apps []model.IntegrationApp
	query := r.db.WithContext(ctx).Model(&model.IntegrationApp{})
	if provider != "" {
		query = query.Where("provider = ?", provider)
	}

	if err := query.Debug().Scan(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *integrationRepository) GetIntegrationAccountList(ctx context.Context, provider *model.IntegrationProvider, userID *int64) ([]model.IntegrationAccount, error) {
	var accounts []model.IntegrationAccount
	query := r.db.WithContext(ctx).Model(&model.IntegrationAccount{})
	if provider != nil {
		query = query.Where("provider = ?", *provider)
	}
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if err := query.Debug().Scan(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *integrationRepository) UnlinkIntegrationAccount(ctx context.Context, userID int64, provider model.IntegrationProvider) error {
	if err := r.db.WithContext(ctx).Unscoped().Where("user_id = ? AND provider = ?", userID, provider).Delete(&model.IntegrationAccount{}).Error; err != nil {
		return err
	}
	return nil
}
