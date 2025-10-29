package handlers

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"gin-notebook/internal/pkg/integration/feishu"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/tools"
	"net/http"
	"sort"
	"time"

	larkdocx "github.com/larksuite/oapi-sdk-go/v3/service/docx/v1"

	"github.com/hibiken/asynq"

	"gorm.io/gorm"
)

type SyncDeps struct {
	DB           *gorm.DB
	FeishuClient *feishu.Client
}

func HandleInitSyncNote(ctx context.Context, t *asynq.Task) error {
	var p types.SyncNotePayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	fail := func(cause error, msg string) error {
		return initFail(ctx, p.LinkID, msg, cause)
	}

	client := feishu.GetClient()
	if client == nil {
		return fail(fmt.Errorf("Feishu integration not configured"), "Feishu integration not configured")
	}

	defer func() {
		logger.LogInfo("HandleInitSyncNote completed", map[string]interface{}{"note_id": p.NoteID, "link_id": p.LinkID})
	}()

	unlock, err := cache.RedisInstance.Lock(ctx, fmt.Sprintf("sync:init:%d", p.LinkID), 5*time.Minute)
	if err != nil {
		return fail(err, "Acquire init lock failed")
	}
	defer unlock()

	link, err := repository.GetNoteSyncByID(database.DB, ctx, p.LinkID)
	if err != nil {
		return fail(err, "Failed to get note sync link")
	}

	// 已就绪直接补门闩并返回
	if link.InitStatus == model.InitReady {
		_ = cache.RedisInstance.Set(ctx, fmt.Sprintf("sync:ready:%d", link.ID), "1", 0)
		logger.LogInfo("Init already ready, skip", map[string]interface{}{"note_id": p.NoteID, "link_id": p.LinkID})
		return nil
	}

	// 置为 running（CAS）
	if err := repository.UpdateNoteSync(
		ctx, database.DB,
		"id = ? AND init_status IN ?",
		[]interface{}{link.ID, []string{string(model.InitPending), string(model.InitRunning)}},
		map[string]interface{}{"init_status": model.InitRunning, "updated_at": time.Now()},
	); err != nil {
		return fail(err, "Failed to update init_status to running")
	}

	var (
		baseVersion int64
		blocks      dto.Blocks
		targetID    = p.TargetNoteID
	)
	if link.TargetNoteID != "" {
		targetID = link.TargetNoteID
	}

	// 事务级快照读取
	if err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := repository.SetTransactionIsolationLevel(ctx, tx, repository.IsolationRepeatableRead); err != nil {
			return fail(err, "Set isolation level failed")
		}
		note, err := repository.GetNoteByID(tx, ctx, p.WorkspaceID, p.NoteID)
		if err != nil {
			return fail(err, "Failed to get note data")
		}
		if err := json.Unmarshal(note.Content, &blocks); err != nil {
			return fail(fmt.Errorf("unmarshal note content: %w", err), "Unmarshal note content failed")
		}
		baseVersion = note.Version
		return nil
	}); err != nil {
		return err // 上面已用 fail，直接把错误抛出即可
	}

	integrationRepo := repository.NewIntegrationRepository(database.DB)
	account, err := integrationRepo.GetIntegrationAccountByUser(ctx, tools.Ptr(model.ProviderFeishu), &p.UserID)
	if err != nil {
		return fail(err, "Failed to get integration account")
	}

	remoteBlocks, err := client.GetNoteAllBlocks(ctx, account.AccessTokenEnc, targetID, nil)
	if err != nil {
		return fail(err, "Failed to get remote blocks from Feishu")
	}

	var feishuPageUID string
	for _, block := range remoteBlocks.Items {
		if block.BlockType != nil && *block.BlockType == 1 {
			feishuPageUID = *block.BlockId
			break
		}
	}
	if feishuPageUID == "" {
		return fail(fmt.Errorf("page block not found"), "Feishu page block not found")
	}

	// 清空旧子块（你当前是范围删除；若以后换成倒序单元素范围删除，这里同样包 fail）
	if len(remoteBlocks.Items) > 1 {
		if err := client.DeleteBlocks(ctx, targetID, account.AccessTokenEnc, feishuPageUID, 0, len(remoteBlocks.Items)-1); err != nil {
			return fail(err, "Failed to delete old Feishu blocks")
		}
	}
	// 创建新块（建议带幂等键；若 SDK 支持，添加 feishu.WithIdempotencyKey(...)）
	feishuBlocks := feishu.ParseBlockToLark(blocks)
	chunks := tools.Chunk(feishuBlocks, 20)
	reqID := fmt.Sprintf("sync:init:%d:%d", p.LinkID, baseVersion)

	children := []*larkdocx.Block{}
	for _, chunk := range chunks {
		data, err := client.CreateBlocks(ctx, account.AccessTokenEnc, feishuPageUID, feishuPageUID, chunk, -1, &http.Header{
			"Idempotency-Key": []string{reqID},
		})
		if err != nil {
			return fail(err, "Failed to create Feishu blocks")
		}
		children = append(children, data.Children...)
	}

	// 写映射
	if err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		syncRepo := repository.NewSyncRepository(tx)
		ts := time.Now().UTC()
		mappings := make([]model.NoteExternalNodeMapping, 0, len(children))
		for i := range children {
			if i >= len(blocks) {
				break
			}
			mappings = append(mappings, model.NoteExternalNodeMapping{
				NoteID:           p.NoteID,
				Provider:         model.ProviderFeishu,
				NodeUID:          blocks[i].ID,
				ExternalDocID:    targetID,
				ExternalBlockID:  *children[i].BlockId,
				ExternalParentID: *children[i].ParentId,
				SyncStatus:       model.SyncSuccess,
				LastSyncedAt:     ts,
			})
		}
		if err := syncRepo.UpsertNoteExternalNodeMappings(ctx, &mappings); err != nil {
			return fail(err, "Upsert node mappings failed")
		}
		return nil
	}); err != nil {
		return err // 上面已 fail
	}

	// 标记 ready + success + 基线推进
	now := time.Now()
	if err := repository.UpdateNoteSync(
		ctx, database.DB,
		"id = ?",
		[]interface{}{link.ID},
		map[string]interface{}{
			"init_status":     model.InitReady,
			"last_status":     model.SyncSuccess,
			"content_version": baseVersion,
			"last_synced_at":  now,
			"last_error":      nil,
			"updated_at":      now,
			"target_note_id":  targetID,
		},
	); err != nil {
		return fail(err, "Update link to ready failed")
	}

	// 门闩
	_ = cache.RedisInstance.Set(ctx, fmt.Sprintf("sync:ready:%d", link.ID), "1", 0)
	return nil
}

func initFail(ctx context.Context, linkID int64, reason string, cause error) error {
	_ = repository.UpdateNoteSync(ctx, database.DB,
		"id = ? AND init_status IN ?",
		[]interface{}{linkID, []string{string(model.InitPending), string(model.InitRunning)}},
		map[string]interface{}{
			"init_status": model.InitFailed,
			"last_status": model.SyncFailed,
			"last_error":  reason,
			"updated_at":  time.Now(),
		},
	)
	cache.RedisInstance.Del(ctx, fmt.Sprintf("sync:ready:%d", linkID))
	return cause
}

func prefixEquals(full, prefix []*larkdocx.Block) bool {
	if len(full) < len(prefix) {
		return false
	}
	for i := range prefix {
		if full[i].BlockId != prefix[i].BlockId {
			return false
		}
	}
	return true
}

func HandleSyncDelta(ctx context.Context, t *asynq.Task) error {
	var p types.SyncDeltaPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		logger.LogError(err, "[sync.delta] 解析 payload 失败")
		return err
	}
	logger.LogInfo(fmt.Sprintf("[sync.delta] 开始处理 link=%d user=%d", p.LinkID, p.UserID))

	var link *model.NoteExternalLink
	readyKey := fmt.Sprintf("sync:ready:%d", p.LinkID)

	// ---------- 检查初始化状态 ----------
	val, _ := cache.RedisInstance.Get(readyKey)
	if val != "1" {
		logger.LogInfo("[sync.delta] 检查初始化状态 link=", p.LinkID)
		link, err := repository.GetNoteSyncByID(database.DB, ctx, p.LinkID)
		if err != nil {
			logger.LogError(err, "[sync.delta] 获取 link 失败")
			return err
		}
		if link.InitStatus != model.InitReady {
			logger.LogInfo(fmt.Sprintf("[sync.delta] link=%d 未就绪，等待中", p.LinkID))
			return nil
		}
		_ = cache.RedisInstance.Set(ctx, readyKey, "1", 0)
	}

	// ---------- Redis锁 ----------
	lockKey := fmt.Sprintf("sync:delta:%d", p.LinkID)
	unlock, err := cache.RedisInstance.Lock(ctx, lockKey, 2*time.Minute)
	if err != nil {
		logger.LogError(err, "[sync.delta] 加锁失败 key=", lockKey)
		return err
	}
	defer unlock()
	logger.LogInfo("[sync.delta] 获取锁成功 key=", lockKey)

	if link == nil {
		link, err = repository.GetNoteSyncByID(database.DB, ctx, p.LinkID)
		if err != nil {
			logger.LogError(err, "[sync.delta] 获取 link 失败")
			return err
		}
	}

	client := feishu.GetClient()
	if client == nil {
		logger.LogError(nil, "[sync.delta] Feishu client 未初始化")
		return fmt.Errorf("Feishu integration not configured")
	}

	account, err := repository.NewIntegrationRepository(database.DB).
		GetIntegrationAccountByUser(ctx, tools.Ptr(model.ProviderFeishu), &p.UserID)
	if err != nil {
		logger.LogError(err, "[sync.delta] 获取集成账户失败")
		return err
	}
	if account == nil || !account.IsActive || account.AccessTokenExpiry == nil || account.AccessTokenExpiry.Before(time.Now()) {
		logger.LogInfo(fmt.Sprintf("[sync.delta] 集成账户失效 user=%d", p.UserID))
		return fmt.Errorf("integration account expired")
	}

	for {
		ob, err := nextOutboxForLink(ctx, database.DB, link.ID)
		if err != nil {
			if err == sql.ErrNoRows {
				logger.LogInfo(fmt.Sprintf("[sync.delta] link=%d 无更多任务，结束", link.ID))
				return nil
			}
			logger.LogError(err, "[sync.delta] 获取 outbox 失败")
			return err
		}

		if link.ContentVersion >= ob.NoteVersion {
			logger.LogInfo(fmt.Sprintf("[sync.delta] outbox id=%d 版本过旧 noteVersion=%d linkVersion=%d，跳过", ob.ID, ob.NoteVersion, link.ContentVersion))
			syncRepo := repository.NewSyncRepository(database.DB)
			if err := syncRepo.UpdateSyncOutboxByID(ctx, database.DB, ob.ID, nil, map[string]interface{}{
				"status": model.SyncSkipped,
			}); err != nil {
				logger.LogError(err, "跳过失败")
				return err
			}
		}

		logger.LogInfo("[sync.delta] 开始执行 outbox id=%d noteVersion=%d op=%s", ob.ID, ob.NoteVersion, ob.OpType)

		if err := applyOutboxToFeishu(ctx, database.DB, client, account, link, &ob); err != nil {
			logger.LogError(err, "[sync.delta] applyOutboxToFeishu 失败 id=", ob.ID)
			_ = markOutboxPending(ctx, ob.ID, err)
			return err
		}

		if err := advanceBaselineAndFinish(ctx, link.ID, ob.ID, ob.NoteVersion); err != nil {
			logger.LogError(err, fmt.Sprintf("[sync.delta] advanceBaselineAndFinish 失败 link=%d ob=%d", link.ID, ob.ID))
			_ = markOutboxPending(ctx, ob.ID, err)
			return err
		}

		logger.LogInfo(fmt.Sprintf("[sync.delta] 成功完成 outbox id=%d version=%d", ob.ID, ob.NoteVersion))
		note, err := repository.GetNoteByID(database.DB, ctx, p.WorkspaceID, p.NoteID) // keep tx snapshot fresh
		if err != nil {
			logger.LogError(err, "[sync.delta] 获取 note 失败")
			return err
		}

		if note.Version == ob.NoteVersion {
			logger.LogInfo(fmt.Sprintf("[sync.delta] note 已同步到最新 version=%d，结束", note.Version))
			return nil
		}
	}
}

func nextOutboxForLink(ctx context.Context, db *gorm.DB, linkID int64) (model.SyncOutbox, error) {
	var ob model.SyncOutbox
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		syncRepo := repository.NewSyncRepository(tx)
		base, err := repository.GetNoteExternalLinkContentVersion(ctx, tx, linkID)
		if err != nil {
			logger.LogError(err, "[sync.nextOutbox] 获取 content_version 失败 link=", linkID)
			return err
		}

		nextVersion := base + 1
		logger.LogInfo("[sync.nextOutbox] 获取 content_version=", base, " 下一个版本=", nextVersion)
		ob, err = syncRepo.GetSequenceSynOutbox(ctx, linkID, tools.Ptr(model.SyncPending), &nextVersion)

		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				logger.LogInfo(fmt.Sprintf("[sync.nextOutbox] 未找到连续任务 link=%d base=%d", linkID, base))
			}
			return err
		}

		logger.LogInfo(fmt.Sprintf("[sync.nextOutbox] 找到 outbox id=%d noteVersion=%d", ob.ID, ob.NoteVersion))
		return syncRepo.UpdateSyncOutboxByID(ctx, tx, ob.ID, tools.Ptr(model.SyncPending), map[string]interface{}{
			"status":     model.SyncRunning,
			"updated_at": time.Now(),
		})

	})
	return ob, err
}

func applyOutboxToFeishu(
	ctx context.Context,
	db *gorm.DB,
	client *feishu.Client,
	account *model.IntegrationAccount,
	link *model.NoteExternalLink,
	ob *model.SyncOutbox,
) error {
	logger.LogInfo(fmt.Sprintf("[sync.apply] 开始应用 op=%s version=%d", ob.OpType, ob.NoteVersion))
	idKey := fmt.Sprintf("delta:%d:v%d:%x", link.ID, ob.NoteVersion, md5.Sum([]byte(ob.PatchJSON)))
	blocks, err := getProviderBlocks(ctx, model.ProviderFeishu, client, account.AccessTokenEnc, link.TargetNoteID)
	if err != nil {
		logger.LogError(err, "[sync.apply] 获取 page block 失败")
		return err
	}

	var pageID string
	var actions []dto.PatchOp
	for _, block := range blocks {
		if block.BlockType != nil && *block.BlockType == 1 {
			pageID = *block.BlockId
			break
		}
	}
	switch ob.OpType {
	case "insert", "patch":
		if len(ob.PatchJSON) > 0 {
			if err := json.Unmarshal([]byte(ob.PatchJSON), &actions); err != nil {
				logger.LogError(err, "[sync.apply.insert] 解析 PatchJSON 失败")
				return err
			}
		}
		logger.LogInfo(fmt.Sprintf("[sync.apply.insert] 准备执行 %d 个 actions", len(actions)))

		var options = &ApplyOptions{
			TargetBlocks: &blocks,
			Provider:     tools.Ptr(model.ProviderFeishu),
		}

		return doApplyActionsToFeishu(db, ctx, link.NoteID, client, account.AccessTokenEnc, link.TargetNoteID, pageID, actions, idKey, options)
	default:
		logger.LogInfo("[sync.apply] 未知操作类型: %s", ob.OpType)
		return fmt.Errorf("unsupported op_type: %s", ob.OpType)
	}
}

func advanceBaselineAndFinish(ctx context.Context, linkID, outboxID, noteVersion int64) error {
	logger.LogInfo(fmt.Sprintf("[sync.delta] 尝试推进基线 link=%d outbox=%d noteVersion=%d", linkID, outboxID, noteVersion))
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		logger.LogInfo("[sync.delta] 标记 outbox 为完成 outbox=", outboxID)
		syncRepo := repository.NewSyncRepository(tx)
		err := syncRepo.UpdateSyncOutboxByID(ctx, tx, outboxID, nil, map[string]any{
			"status":     model.SyncSuccess,
			"updated_at": time.Now(),
		})

		if err != nil {
			logger.LogError(err, "[sync.delta] CAS 更新 outbox 状态失败")
			return err
		}

		logger.LogInfo(fmt.Sprintf("[sync.delta] 执行 CAS 更新 link=%d from=%d to=%d", linkID, noteVersion-1, noteVersion))
		res := tx.Model(&model.NoteExternalLink{}).
			Debug().
			Where("id = ? AND content_version = ?", linkID, noteVersion-1).
			Updates(map[string]any{
				"content_version": gorm.Expr("content_version + 1"),
				"last_status":     model.SyncSuccess,
				"last_synced_at":  time.Now(),
				"updated_at":      time.Now(),
			})
		if res.Error != nil {
			logger.LogError(res.Error, "[sync.delta] 更新 link.content_version 失败")
			return res.Error
		}
		if res.RowsAffected == 0 {
			logger.LogInfo(fmt.Sprintf("[sync.delta] CAS 失败 link_id=%d expect=%d", linkID, noteVersion-1))
			return fmt.Errorf("CAS failed: link_id=%d expect=%d", linkID, noteVersion-1)
		}
		logger.LogInfo(fmt.Sprintf("[sync.delta] CAS 成功 link=%d 已推进到版本=%d", linkID, noteVersion))
		return nil
	})
}

// ========== 失败回退 ==========
func markOutboxPending(ctx context.Context, outboxID int64, cause error) error {
	logger.LogInfo("[sync.delta] 标记 outbox=", outboxID, " 回退为 pending, error=", cause)
	syncRepo := repository.NewSyncRepository(database.DB)
	return syncRepo.UpdateSyncOutboxByID(ctx, database.DB, outboxID, nil, map[string]interface{}{
		"status":     model.SyncPending,
		"updated_at": time.Now(),
		"last_error": cause.Error(),
	})
}

// ========== 获取 Feishu 页面主 Block ==========
func getProviderBlocks(ctx context.Context, provider model.IntegrationProvider, c *feishu.Client, userToken, docID string) ([]*larkdocx.Block, error) {
	switch provider {
	case model.ProviderFeishu:
		logger.LogInfo("[sync.delta] 获取飞书文档主 block docID=", docID)

		blocks, err := c.GetNoteAllBlocks(ctx, userToken, docID, nil)
		if err != nil {
			logger.LogError(err, "[sync.delta] 获取飞书 blocks 失败")
			return []*larkdocx.Block{}, err
		}
		logger.LogInfo("items lengths: ", len(blocks.Items))
		return blocks.Items, nil
	}
	return []*larkdocx.Block{}, fmt.Errorf("unsupported provider: %s", provider)
}

type ApplyOptions struct {
	TargetBlocks *[]*larkdocx.Block
	Provider     *model.IntegrationProvider
}

type Chain struct {
	Block    dto.Blocks
	AfterID  *string
	BeforeID *string
	Head     string // 第一块的 NodeUID
	Tail     string // 最后一块的 NodeUID
}

func doApplyActionsToFeishu(
	db *gorm.DB,
	ctx context.Context,
	noteID int64,
	client *feishu.Client,
	userToken, docID, pageID string,
	actions []dto.PatchOp,
	idempKey string,
	options *ApplyOptions,
) error {
	logger.LogInfo("[sync.delta] 开始 apply actions 到 Feishu noteID=", noteID, " docID=", docID, " action_count=", len(actions))

	blockIDs := make([]string, 0)
	blockMapping := make(map[string]ExternalBlockMapping) // 本地 blockID → 飞书 blockID
	updateBlocks := []*feishu.UpdateFeishuBlock{}
	insertBlocks := []*feishu.CreateFeishuBlock{}

	// ---------- 目标页面已有块的索引（用于定位插入位置） ----------
	targetBlockMapping := map[string]int{}
	if options != nil && options.TargetBlocks != nil {
		logger.LogInfo("[sync.delta] 目标页面已有块数=", len(*options.TargetBlocks))
		for idx, b := range *options.TargetBlocks {
			if b.BlockId != nil {
				targetBlockMapping[*b.BlockId] = idx
			} else {
				logger.LogInfo("[sync.delta] 目标页面块缺少 BlockId，跳过 idx=", b)
			}
		}
	}
	// ---------- 乱序 insert 分组（内联“groupInsertsAnyOrder”逻辑） ----------
	tailIdx := make(map[string]*Chain) // key: Tail NodeUID -> *Chain
	headIdx := make(map[string]*Chain) // key: Head NodeUID -> *Chain

	mergeRight := func(a, b *Chain) *Chain { // a ... b
		a.Block = append(a.Block, b.Block...)
		a.BeforeID = b.BeforeID
		// 清理旧索引
		delete(tailIdx, a.Tail)
		delete(headIdx, b.Head)
		// 更新 a 的尾并重建索引
		a.Tail = b.Tail
		tailIdx[a.Tail] = a
		headIdx[a.Head] = a
		return a
	}

	// ---------- 遍历 actions：收集 update，同时把 insert 纳入链归并 ----------
	for _, act := range actions {
		if act.Block != nil {
			logger.LogInfo(fmt.Sprintf("[sync.delta] 执行 action op=%s blockID=%s", act.Op, act.Block.ID))
			blockIDs = append(blockIDs, act.Block.ID)
		} else {
			logger.LogInfo(fmt.Sprintf("[sync.delta] 执行 action op=%s (nil block)", act.Op))
		}

		switch act.Op {
		case "insert":
			if act.Block == nil {
				logger.LogInfo("[sync.delta] 跳过空 block 的 insert action")
				continue
			}

			// —— 双向合并：先查左右，再决定如何归并，最后再注册到索引（避免 right 命中自己）
			var left *Chain  // 尝试找“左侧链”：其尾 == 我这块的 AfterID
			var right *Chain // 尝试找“右侧链”：其头 == 我这块的 NodeUID（可能为 nil）

			if act.AfterID != nil {
				blockIDs = append(blockIDs, *act.AfterID)
				if ch, ok := tailIdx[*act.AfterID]; ok {
					left = ch
				}
			}

			if act.BeforeID != nil {
				blockIDs = append(blockIDs, *act.BeforeID)
			}
			if ch, ok := headIdx[act.NodeUID]; ok {
				right = ch
			}

			switch {
			case left != nil && right != nil:
				cur := &Chain{
					Block:    dto.Blocks{*act.Block},
					AfterID:  act.AfterID,
					BeforeID: act.BeforeID,
					Head:     act.NodeUID,
					Tail:     act.NodeUID,
				}
				_ = mergeRight(left, cur)
				_ = mergeRight(left, right)

			case left != nil:
				// 只有左：把当前块接到左链尾部
				cur := &Chain{
					Block:    dto.Blocks{*act.Block},
					AfterID:  act.AfterID,
					BeforeID: act.BeforeID,
					Head:     act.NodeUID,
					Tail:     act.NodeUID,
				}
				_ = mergeRight(left, cur)

			case right != nil:
				// 只有右：当前块在前，接上右链
				cur := &Chain{
					Block:    dto.Blocks{*act.Block},
					AfterID:  act.AfterID,
					BeforeID: act.BeforeID,
					Head:     act.NodeUID,
					Tail:     act.NodeUID,
				}
				_ = mergeRight(cur, right)
				// 注意：mergeRight 内部会更新索引，这里无需额外注册

			default:
				// 两边都接不上：新建独立链并注册索引
				cur := &Chain{
					Block:    dto.Blocks{*act.Block},
					AfterID:  act.AfterID,
					BeforeID: act.BeforeID,
					Head:     act.NodeUID,
					Tail:     act.NodeUID,
				}
				tailIdx[cur.Tail] = cur
				headIdx[cur.Head] = cur
			}

		case "update":
			if act.Block == nil {
				logger.LogInfo("[sync.delta] 跳过空 block 的 update action")
				continue
			}
			larkBlock := feishu.ParseBlockToLark(dto.Blocks{*act.Block})
			blockMapping[act.NodeUID] = ExternalBlockMapping{}
			updateBlocks = append(updateBlocks, &feishu.UpdateFeishuBlock{
				LocalBlockID: act.Block.ID,
				Block:        larkBlock[0],
			})

		case "replace":
			logger.LogInfo("[sync.delta] 执行 replace action block=", func() string {
				if act.Block != nil {
					return act.Block.ID
				}
				return "<nil>"
			}())

		case "delete":
			logger.LogInfo("[sync.delta] 执行 delete action block=", func() string {
				if act.Block != nil {
					return act.Block.ID
				}
				return "<nil>"
			}())
		}
	}

	// ---------- 补齐 block 映射（仅 update 需要；insert 是新建，不必依赖映射） ----------
	if len(blockIDs) > 0 {
		syncRepo := repository.NewSyncRepository(db)
		logger.LogInfo("[sync.delta] 查询 block 映射关系数量=", len(blockIDs))
		bmapping, err := syncRepo.GetBlockMappingByBlockIDs(ctx, noteID, tools.Ptr(model.ProviderFeishu), &blockIDs)
		if err != nil {
			logger.LogError(err, "[sync.delta] 获取 block 映射失败")
			return err
		}
		for _, m := range *bmapping {
			blockMapping[m.NodeUID] = ExternalBlockMapping{
				BlockID: m.ExternalBlockID,
			}
			logger.LogInfo("[sync.delta] 绑定 block 映射: ", m.NodeUID, " → ", m.ExternalBlockID)
		}
	}

	// ---------- 批量更新（保持你的逻辑） ----------
	if len(updateBlocks) > 0 {
		logger.LogInfo("[sync.delta] blockMapping", blockMapping)
		write := 0
		for _, ub := range updateBlocks {
			if ub == nil {
				continue
			}
			mapping, ok := blockMapping[ub.LocalBlockID]
			if ok && mapping.BlockID != "" {
				ub.TargetBlockID = mapping.BlockID
				updateBlocks[write] = ub
				write++
				logger.LogInfo(fmt.Sprintf("[sync.delta] 准备更新 Feishu block 本地ID=%s 飞书ID=%s", ub.LocalBlockID, mapping.BlockID))
			} else {
				logger.LogInfo(fmt.Sprintf("[sync.delta] 未找到 Feishu block 映射，本地ID=%s，已从更新列表移除", ub.LocalBlockID))
			}
		}
		updateBlocks = updateBlocks[:write]

		logger.LogInfo("[sync.delta] 批量更新 Feishu blocks 数量=", len(updateBlocks))
		_, err := client.BatchUpdateBlocks(ctx, docID, userToken, updateBlocks, &http.Header{
			"Idempotency-Key": []string{idempKey},
		})
		if err != nil {
			logger.LogError(err, "[sync.delta] 批量更新 Feishu blocks 失败")
			return err
		}
		logger.LogInfo("[sync.delta] 批量更新 Feishu blocks 成功 docID=", docID)
	}

	seen := make(map[*Chain]struct{})
	for _, ch := range headIdx {
		if _, ok := seen[ch]; ok {
			continue
		}
		seen[ch] = struct{}{}

		// DTO → Lark blocks（一次性插入整段）
		larkBlocks := feishu.ParseBlockToLark(ch.Block)

		task := &feishu.CreateFeishuBlock{
			// LocalBlockID 可选：若你要用于日志或调试，可取第一块的 ID
			LocalBlockIDs: func() []string {
				ids := make([]string, 0, len(ch.Block))
				for _, b := range ch.Block {
					ids = append(ids, b.ID)
				}
				return ids
			}(),
			Block: larkBlocks, // 整段
			// After/Before 只用于计算 Index，这里直接算 Index
		}

		// 计算插入 Index：优先 AfterID（+1），其次 BeforeID（自身位置）
		index := -1
		logger.LogInfo("targetBlockMapping: ", targetBlockMapping)
		if ch.BeforeID != nil {
			logger.LogInfo(fmt.Sprintf("Before ID: %s, BlockID: %s", *ch.BeforeID, blockMapping[*ch.BeforeID].BlockID))

			if beforeIndex, ok := targetBlockMapping[blockMapping[*ch.BeforeID].BlockID]; ok {
				// !! BeforeID 指向的块会被推后，所以插入位置要 -1, 勿改
				index = beforeIndex - 1
			}
		}

		if ch.AfterID != nil && index == -1 {
			logger.LogInfo(fmt.Sprintf("AfterID: %s, BlockID: %s", *ch.AfterID, blockMapping[*ch.AfterID].BlockID))

			if afterIndex, ok := targetBlockMapping[blockMapping[*ch.AfterID].BlockID]; ok {
				index = afterIndex
			}
		}

		logger.LogInfo(fmt.Sprintf("[sync.delta] 批量插入链 Head=%s Tail=%s 计算插入 Index=%d", ch.Head, ch.Tail, index))
		if index < 0 {
			index = 0 // 默认从顶部插入
		}
		task.Index = index

		insertBlocks = append(insertBlocks, task)
	}

	if len(insertBlocks) > 0 {
		logger.LogInfo("[sync.delta] 批量插入 Feishu blocks 数量=", len(insertBlocks))
		syncRepo := repository.NewSyncRepository(db)
		sort.SliceStable(insertBlocks, func(i, j int) bool {
			return insertBlocks[i].Index > insertBlocks[j].Index
		})

		for _, st := range insertBlocks {
			if st == nil {
				continue
			}
			resp, err := client.CreateBlocks(ctx, userToken, docID, pageID, st.Block, st.Index, &http.Header{
				"Idempotency-Key": []string{idempKey},
			})

			if err != nil {
				logger.LogError(err, "[sync.delta] 批量插入 Feishu blocks 失败")
				return err
			}
			var blockMappingModels []model.NoteExternalNodeMapping

			for i, b := range resp.Children {
				logger.LogInfo(fmt.Sprintf("[sync.delta] 插入 Feishu block 本地ID=%s 飞书ID=%s", st.LocalBlockIDs, *b.BlockId))
				blockMappingModels = append(blockMappingModels, model.NoteExternalNodeMapping{
					NoteID:           noteID,
					Provider:         model.ProviderFeishu,
					NodeUID:          st.LocalBlockIDs[i],
					ExternalDocID:    docID,
					ExternalBlockID:  *b.BlockId,
					ExternalParentID: *b.ParentId,
					SyncStatus:       model.SyncSuccess,
					LastSyncedAt:     time.Now().UTC(),
				})
			}
			err = syncRepo.UpsertNoteExternalNodeMappings(ctx, &blockMappingModels)
			if err != nil {
				logger.LogError(err, "[sync.delta] 插入 Feishu blocks 后写映射失败")
				return err
			}

		}
		logger.LogInfo("[sync.delta] 批量插入 Feishu blocks 成功 docID=", docID)
	}

	logger.LogInfo("[sync.delta] 所有 actions 执行完毕")
	return nil
}

// ========== 失败回退（写 last_error 并回到 pending） ==========

// 全量构建（如果你用不到可删除）
func buildBlocksFromFull(raw []byte) ([]*larkdocx.Block, error) {
	// TODO: 把 raw 解析为飞书 blocks；或直接从本地数据重新组装
	return []*larkdocx.Block{}, nil
}

type ExternalBlockMapping struct {
	BlockID string
	// Block   *larkdocx.Block
}
