package repository

import (
	"context"
	"fmt"

	"gorm.io/gorm"
)

// IsolationLevel 是隔离级别的枚举，方便统一管理
type IsolationLevel string

const (
	IsolationReadUncommitted IsolationLevel = "READ UNCOMMITTED"
	IsolationReadCommitted   IsolationLevel = "READ COMMITTED"
	IsolationRepeatableRead  IsolationLevel = "REPEATABLE READ"
	IsolationSerializable    IsolationLevel = "SERIALIZABLE"
)

func SetTransactionIsolationLevel(ctx context.Context, tx *gorm.DB, level IsolationLevel) error {
	if tx == nil {
		return fmt.Errorf("tx is nil: must be inside transaction")
	}

	dbType := tx.Dialector.Name()
	var stmt string

	switch dbType {
	case "postgres":
		stmt = fmt.Sprintf("SET TRANSACTION ISOLATION LEVEL %s;", level)
	case "mysql":
		stmt = fmt.Sprintf("SET SESSION TRANSACTION ISOLATION LEVEL %s;", level)
	default:
		stmt = fmt.Sprintf("SET TRANSACTION ISOLATION LEVEL %s;", level)
	}

	if err := tx.WithContext(ctx).Exec(stmt).Error; err != nil {
		return fmt.Errorf("[%s] failed to set isolation level: %w", dbType, err)
	}
	return nil
}
