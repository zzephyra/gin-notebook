package repository

import (
	"encoding/base64"
	"encoding/json"
)

type QueryCondition struct {
	Field    string
	Operator string
	Value    interface{}
}

type DatabaseExtraOptions struct {
	WithLock bool // 是否加锁
}

type DatabaseExtraOpt func(*DatabaseExtraOptions)

func WithLock() DatabaseExtraOpt {
	return func(opt *DatabaseExtraOptions) {
		opt.WithLock = true
	}
}

type BoundRow struct {
	ColumnID int64  `gorm:"column:column_id"`
	B1       string `gorm:"column:b1"`  // 边界的 order_index
	BID      int64  `gorm:"column:bid"` // 边界那行的 id
}

type CursorTok struct {
	F1  *string `json:"f1,omitempty"` // from.key1
	FID *int64  `json:"fid,string,omitempty"`
	B1  *string `json:"b1,omitempty"` // bound.key1
	BID *int64  `json:"bid,string,omitempty"`
}

func (tk *CursorTok) Encode() string {
	b, _ := json.Marshal(tk)
	return base64.RawURLEncoding.EncodeToString(b)
}

type ColPageInfo struct {
	Total   int  // 该列被边界裁剪后的总行数
	HasNext bool // 是否还有下一页（total > 当前页最大 rn）
}

type headRow struct {
	ID         *int64  `gorm:"column:id"`
	ColumnID   int64   `gorm:"column:column_id"`
	OrderIndex *string `gorm:"column:order_index"`
	Priority   *uint8  `gorm:"column:priority"` // smallint/uint8
}
