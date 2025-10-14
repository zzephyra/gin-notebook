package integrationService

import (
	"context"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/dto"
)

type NotionService interface {
	// 绑定：将 note 与某个 notion page 关联起来
	LinkNoteToPage(ctx context.Context, noteID int64, notionPageID string, linkedByUserID int64, policy model.ConflictPolicy) error
	// 取消绑定
	UnlinkNote(ctx context.Context, noteID int64) error
	// 同步
	SyncNote(ctx context.Context, noteID int64, mode SyncMode) error
	// 批量补充派生字段（便于列表展示）
	AttachNotionPageIDs(ctx context.Context, notes []*model.Note) error
	UnlinkAccount(ctx context.Context, userID int64, provider model.IntegrationProvider, accountID string) error
	LinkAccount(ctx context.Context, userID int64, provider model.IntegrationProvider, accountID string) (*model.IntegrationAccount, error)
}

type notionService struct{}

func NewNotionService() *notionService {
	return &notionService{}
}

func (s *notionService) LinkNoteToPage(ctx context.Context) error {
	return nil
}

func (s *notionService) LinkAccount(ctx context.Context, params dto.IntegrationAccountCreateDTO) error {
	return nil
}
