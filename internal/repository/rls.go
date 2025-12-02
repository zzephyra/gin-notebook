package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

type AuthCtx struct {
	UserID      int64
	WorkspaceID int64
}

type TxMode struct {
	ReadOnly bool
}

type TxOption func(*TxMode)

func WithReadOnly() TxOption {
	return func(m *TxMode) { m.ReadOnly = true }
}

// BeginWithRLS 开启一个绑定 RLS 上下文的事务，并返回 (tx, finish, err)
// finish 要在调用端最后执行：finish(nil) 提交；finish(err) 或中断则回滚
func BeginWithRLS(ctx context.Context, db *gorm.DB, auth AuthCtx, opts ...TxOption) (*gorm.DB, func(error), error) {
	mode := &TxMode{}
	for _, o := range opts {
		o(mode)
	}

	// 新会话 + 开事务
	tx := db.Session(&gorm.Session{NewDB: true}).Begin()
	if tx.Error != nil {
		return nil, nil, tx.Error
	}

	// 可选：只读事务（比如 GET 列表）
	if mode.ReadOnly {
		if err := tx.Exec("SET LOCAL default_transaction_read_only = on").Error; err != nil {
			tx.Rollback()
			return nil, nil, err
		}
	}

	// 注入 RLS 上下文
	if err := tx.Exec(`SELECT set_config('app.user_id', ?, true)`, fmt.Sprint(auth.UserID)).Error; err != nil {
		tx.Rollback()
		return nil, nil, err
	}

	if err := tx.Exec(`SELECT set_config('app.workspace_id', ?, true)`, fmt.Sprint(auth.WorkspaceID)).Error; err != nil {
		tx.Rollback()
		return nil, nil, err
	}

	// 归还器：根据传入的最终错误/上下文状态决定提交还是回滚
	finish := func(finalErr error) {
		// 上下文被取消/超时也回滚
		if finalErr != nil || ctx.Err() != nil {
			_ = tx.Rollback()
			return
		}
		if err := tx.Commit().Error; err != nil {
			_ = tx.Rollback()
		}
	}

	return tx, finish, nil
}
