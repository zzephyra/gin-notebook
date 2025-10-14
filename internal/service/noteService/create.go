package noteService

import (
	"context"
	"encoding/json"
	"errors"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/pkg/logger"
	"strconv"
	"time"

	"github.com/jinzhu/copier"
	"gorm.io/gorm"
)

func CreateNoteCategory(params *dto.CreateNoteCategoryDTO) (responseCode int, data any) {
	categroyModel := params.ToModel()
	_, err := repository.CreateNoteCategory(categroyModel)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	responseCode = message.SUCCESS
	data = categroyModel
	return
}

func CreateNote(dto *dto.CreateWorkspaceNoteDTO) (responseCode int, data *dto.CreateWorkspaceNoteDTO) {
	noteModel := dto.ToModel([]string{})

	_, err := repository.CreateNote(noteModel)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	dto.ID = &noteModel.ID
	dto.Content = &noteModel.Content

	responseCode = message.SUCCESS
	data = dto
	return
}

func SetFavoriteNote(params *dto.FavoriteNoteDTO) (responseCode int, data any) {
	favoriteNoteModel := model.FavoriteNote{}
	copier.Copy(&favoriteNoteModel, params)

	logger.LogInfo("设置笔记收藏", map[string]interface{}{
		"user_id":     favoriteNoteModel.UserID,
		"note_id":     favoriteNoteModel.NoteID,
		"is_favorite": favoriteNoteModel.IsFavorite,
	})
	err := repository.SetFavoriteNote(&favoriteNoteModel)
	if err != nil {
		errCode := database.IsError(err)
		responseCode = errCode
		return
	}

	responseCode = message.SUCCESS
	return
}

func CreateTemplateNote(params *dto.CreateTemplateNoteDTO) (responseCode int, data *dto.TemplateNote) {
	templateNote := model.TemplateNote{}
	copier.Copy(&templateNote, params)

	err := repository.CreateTemplateNote(database.DB, &templateNote)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}

	responseCode = message.SUCCESS
	data = &dto.TemplateNote{
		ID:        templateNote.ID,
		Title:     templateNote.Title,
		Content:   templateNote.Content,
		IsPublic:  templateNote.IsPublic,
		Cover:     templateNote.Cover,
		CreatedAt: templateNote.CreatedAt,
		UpdatedAt: templateNote.UpdatedAt,
	}
	return
}

func GetTemplateNotes(params *dto.GetTemplateNotesDTO) (responseCode int, data *dto.ListResultDTO[dto.TemplateNote]) {
	templateNotes, total, err := repository.GetTemplateNotes(database.DB, params.UserID, params.Limit, params.Offset)

	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	if templateNotes == nil {
		return
	}
	userID := make([]int64, 0)

	for note := range *templateNotes {
		userID = append(userID, (*templateNotes)[note].OwnerID)
	}

	users, err := repository.GetUserByIDs(userID)
	if err != nil {
		logger.LogError(err, "获取用户信息失败")
		responseCode = message.ERROR_DATABASE
		return
	}

	userMap := make(map[int64]dto.UserBreifDTO, len(*users))

	for _, user := range *users {
		userMap[user.ID] = dto.UserBreifDTO{
			ID:       user.ID,
			Nickname: *user.Nickname,
			Email:    user.Email,
			Avatar:   user.Avatar,
		}
	}

	notes := make([]dto.TemplateNote, 0, len(*templateNotes))
	for note := range *templateNotes {
		notes = append(notes, dto.TemplateNote{
			ID:        (*templateNotes)[note].ID,
			Title:     (*templateNotes)[note].Title,
			Content:   (*templateNotes)[note].Content,
			IsPublic:  (*templateNotes)[note].IsPublic,
			Cover:     (*templateNotes)[note].Cover,
			CreatedAt: (*templateNotes)[note].CreatedAt,
			UpdatedAt: (*templateNotes)[note].UpdatedAt,
			User:      userMap[(*templateNotes)[note].OwnerID],
		})
	}

	data = &dto.ListResultDTO[dto.TemplateNote]{
		Data:  notes,
		Total: total,
	}
	responseCode = message.SUCCESS
	return
}

func AddNoteSync(ctx context.Context, params *dto.AddNoteSyncDTO) (responseCode int, data map[string]interface{}) {
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		syncPolicy := &model.NoteExternalLink{
			MemberID:       params.MemberID,
			NoteID:         params.NoteID,
			Provider:       params.Provider,
			Mode:           params.Mode,
			Direction:      params.Direction,
			TargetNoteID:   params.TargetNoteID,
			ConflictPolicy: params.ConflictPolicy,
			ResType:        "docx",
		}

		syncRepo := repository.NewSyncRepository(tx)
		integrationRepo := repository.NewIntegrationRepository(tx)

		accounts, err := integrationRepo.GetIntegrationAccountList(ctx, &params.Provider, nil)

		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		if len(accounts) == 0 {
			responseCode = message.ERROR_INTEGRATION_ACCOUNT_NOT_FOUND
			return errors.New("integration account not found")
		}

		account := accounts[0] // 目前每个用户每个服务只会有一个账号

		if account.IsActive == false || account.AccessTokenExpiry == nil || account.AccessTokenExpiry.Before(time.Now()) {
			responseCode = message.ERROR_INTEGRATION_ACCOUNT_EXPIRED
			return errors.New("feishu integration account is expired")
		}

		_, err = feishu.GetClient().GetFileMeta(ctx, params.TargetNoteID, "docx", account.AccessTokenEnc)

		if err != nil {
			responseCode = message.ERROR_FEISHU_GET_FILE_META_FAILED
			return errors.New("failed to get Feishu file metadata")
		}

		err = syncRepo.CreateOrUpdateNoteSyncPolicy(ctx, syncPolicy)
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		payload, _ := json.Marshal(map[string]interface{}{
			"note_id":         params.NoteID,
			"member_id":       params.MemberID,
			"provider":        params.Provider,
			"mode":            params.Mode,
			"direction":       params.Direction,
			"target_note_id":  params.TargetNoteID,
			"conflict_policy": params.ConflictPolicy,
		})

		event := model.OutboxEvent{
			Topic:     "note.updated",
			Key:       string(params.NoteID),
			Payload:   payload,
			CreatedAt: time.Now(),
		}

		err = syncRepo.CreateOutboxEvent(ctx, &event)
		if err != nil {
			responseCode = database.IsError(err)
			return err
		}

		data = map[string]interface{}{
			"note_id":         strconv.FormatInt(params.NoteID, 10),
			"provider":        params.Provider,
			"mode":            params.Mode,
			"direction":       params.Direction,
			"target_note_id":  params.TargetNoteID,
			"conflict_policy": params.ConflictPolicy,
			"updated_at":      syncPolicy.UpdatedAt,
			"id":              strconv.FormatInt(syncPolicy.ID, 10),
			"res_type":        syncPolicy.ResType,
			"is_active":       syncPolicy.IsActive,
		}

		return nil
	})

	if err != nil {
		return responseCode, nil
	}

	responseCode = message.SUCCESS
	return
}
