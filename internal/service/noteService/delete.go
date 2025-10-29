package noteService

import (
	"context"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/repository"

	"gorm.io/gorm"
)

func DeleteNote(params *dto.DeleteNoteCategoryDTO) (responseCode int, data any) {
	err := repository.DeleteNote(params.ID)
	if err != nil {
		return message.ERROR_NOTE_DELETE, nil
	}
	responseCode = message.SUCCESS
	return
}

func DeleteSync(ctx context.Context, params *dto.DeleteNoteSyncDTO) (respondeCode int) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		syncRepo := repository.NewSyncRepository(tx)

		_, err := syncRepo.GetNoteSyncByID(ctx, params.SyncID) // 检查同步记录是否存在，为后续支持定时任务做准备

		if err != nil {
			respondeCode = message.ERROR_NOTE_SYNC_NOT_FOUND
			return err
		}

		err = syncRepo.DeleteSyncByID(ctx, params.SyncID, params.NoteID)

		if err != nil {
			respondeCode = database.IsError(err)
			return err
		}

		err = syncRepo.DeleteSyncOutbox(ctx, params.SyncID)

		if err != nil {
			respondeCode = database.IsError(err)
			return err
		}

		return nil
	})

	if err != nil {
		if respondeCode == 0 {
			respondeCode = message.ERROR
		}
		return
	}

	respondeCode = message.SUCCESS
	return
}
