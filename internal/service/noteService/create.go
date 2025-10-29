package noteService

import (
	"context"
	"encoding/json"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/tasks/asynq/enqueue"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/copier"
	"gorm.io/datatypes"
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

func CreateNote(param *dto.CreateWorkspaceNoteDTO) (responseCode int, data *dto.CreateWorkspaceNoteDTO) {
	noteModel := param.ToModel([]string{})

	_, err := repository.CreateNote(noteModel)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}
	param.ID = &noteModel.ID
	var content dto.Blocks
	if noteModel.Content != nil {
		if err = json.Unmarshal(noteModel.Content, &content); err != nil {
			logger.LogError(err, "Unmarshal note content error")
			return message.ERROR, nil
		}
		param.Content = &content
	}
	responseCode = message.SUCCESS
	data = param
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

	responseCode = message.SUCCESS

	var content datatypes.JSON
	if len(params.Content) != 0 {
		contentBytes, err := json.Marshal(params.Content)
		if err != nil {
			logger.LogError(err, "Marshal note content error")
			responseCode = message.ERROR
			return
		}

		content = datatypes.JSON(contentBytes)
	} else {
		initBlocks := dto.Blocks{dto.NoteBlockDTO{
			ID:   uuid.New().String(),
			Type: "paragraph",
			Props: dto.BlockPropsDTO{
				BackgroundColor: tools.Ptr("default"),
				TextColor:       tools.Ptr("default"),
				TextAlignment:   tools.Ptr("left"),
			},
			Content:  []dto.InlineDTO{},
			Children: []dto.NoteBlockDTO{},
		},
		}
		contentBytes, err := json.Marshal(initBlocks)
		if err != nil {
			logger.LogError(err, "Marshal empty note content error")
			responseCode = message.ERROR
			return
		}
		content = datatypes.JSON(contentBytes)
	}

	templateNote.Content = content

	err := repository.CreateTemplateNote(database.DB, &templateNote)
	if err != nil {
		return message.ERROR_DATABASE, nil
	}

	data = &dto.TemplateNote{
		ID:        templateNote.ID,
		Title:     templateNote.Title,
		Content:   params.Content,
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
		var content dto.Blocks
		if err = json.Unmarshal((*templateNotes)[note].Content, &content); err != nil {
			logger.LogError(err, "Unmarshal note content error")
			continue
		}

		notes = append(notes, dto.TemplateNote{
			ID:        (*templateNotes)[note].ID,
			Title:     (*templateNotes)[note].Title,
			Content:   content,
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
	// 0) 事务外校验（可选但推荐，避免长事务）
	//    - 校验集成账号有效
	//    - 如果前置要求必须是已存在的 Feishu 文档，校验 meta（否则可以把 meta 校验挪到 init 任务里做）
	account, err := repository.NewIntegrationRepository(database.DB).
		GetIntegrationAccountByUser(ctx, &params.Provider, &params.UserID)
	if err != nil {
		return database.IsError(err), nil
	}
	if account.IsActive == false || account.AccessTokenExpiry == nil || account.AccessTokenExpiry.Before(time.Now()) {
		return message.ERROR_INTEGRATION_ACCOUNT_EXPIRED, nil
	}

	// （可选）若需要在创建策略前就确认远端 doc 存在：
	meta, err := feishu.GetClient().GetFileMeta(ctx, params.TargetNoteID, "docx", account.AccessTokenEnc)
	if err != nil || len(meta.Metas) == 0 {
		return message.ERROR_FEISHU_GET_FILE_META_FAILED, nil
	}

	var syncID int64
	var updatedAt time.Time

	err = database.DB.Transaction(func(tx *gorm.DB) error {
		tx = tx.WithContext(ctx)

		// 1) 用 tx 读取 note（确保和后续写入在同一事务/快照里）
		note, err := repository.GetNoteByID(tx, ctx, params.WorkspaceID, params.NoteID)
		if err != nil {
			logger.LogError(err, "GetNoteByID error")
			responseCode = database.IsError(err)
			return err
		}

		syncPolicy := &model.NoteExternalLink{
			MemberID:       params.MemberID,
			NoteID:         params.NoteID,
			Provider:       params.Provider,
			Mode:           params.Mode,
			Direction:      params.Direction,
			TargetNoteID:   params.TargetNoteID, // 若允许「绑定已存在的 Feishu 文档」
			ConflictPolicy: params.ConflictPolicy,
			ContentVersion: note.Version, // baseVersion
			ResType:        "docx",
			LastStatus:     model.SyncPending, // ★ 新增：初始化状态
			IsActive:       true,              // 建议默认为启用
		}

		syncRepo := repository.NewSyncRepository(tx)

		err = syncRepo.CreateOrUpdateNoteSyncPolicy(ctx, syncPolicy)
		if err != nil {
			logger.LogError(err, "CreateOrUpdateNoteSyncPolicy error")
			responseCode = database.IsError(err)
			return err
		}

		// 如果你此阶段不打算启用 OutboxEvent，建议先不写：
		// event := model.OutboxEvent{...}
		// if err := syncRepo.CreateOutboxEvent(ctx, &event); err != nil { ... }

		syncID = syncPolicy.ID
		updatedAt = syncPolicy.UpdatedAt

		// 返回给前端的数据
		data = map[string]interface{}{
			"id":              strconv.FormatInt(syncPolicy.ID, 10),
			"note_id":         strconv.FormatInt(params.NoteID, 10),
			"provider":        params.Provider,
			"mode":            params.Mode,
			"direction":       params.Direction,
			"target_note_id":  params.TargetNoteID,
			"conflict_policy": params.ConflictPolicy,
			"res_type":        syncPolicy.ResType,
			"is_active":       syncPolicy.IsActive,
			"status":          syncPolicy.LastStatus,
			"updated_at":      updatedAt,
		}
		return nil
	})

	if err != nil {
		return responseCode, nil
	}

	// 4) 事务提交后再入队初始化任务（避免悬挂任务）
	payload := types.SyncNotePayload{
		NoteID:       params.NoteID,
		MemberID:     params.MemberID,
		UserID:       params.UserID,
		WorkspaceID:  params.WorkspaceID,
		TargetNoteID: params.TargetNoteID,
		LinkID:       syncID, // ★ 建议带上 link_id，方便 worker 精确定位
	}
	enqueue.SyncInitNote(ctx, payload)

	return message.SUCCESS, data
}
