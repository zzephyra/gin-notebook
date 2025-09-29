package repository

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/pkg/database"
	"strings"

	"gorm.io/gorm"
)

func CreateModel[T any](db *gorm.DB, model T) error {
	result := db.Create(model)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteModel[T any](db *gorm.DB, model T) error {
	result := db.Delete(model)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func GetBounds(db *gorm.DB, columnIDs []int64, orderByField string, isAsc bool) ([]BoundRow, error) {
	dir := "DESC"
	if isAsc {
		dir = "ASC"
	}

	// 针对不同数据库准备排序表达式（LexoRank 需要字节序）
	var orderExpr string
	if database.IsPostgres() {
		if orderByField == "order_index" {
			orderExpr = `t.order_index COLLATE "C"`
		} else {
			orderExpr = "t." + orderByField
		}
	} else if database.IsMysql() {
		if orderByField == "order_index" {
			orderExpr = "t.order_index COLLATE ascii_bin"
		} else {
			orderExpr = "t." + orderByField
		}
	} else {
		orderExpr = "t." + orderByField
	}

	sub := db.Table("to_do_tasks AS t").
		Select(fmt.Sprintf(`
            t.column_id,
            t.order_index AS b1,
            t.id AS bid,
            ROW_NUMBER() OVER (
                PARTITION BY t.column_id
                ORDER BY %s %s, t.id DESC
            ) AS rn
        `, orderExpr, dir)).
		Where("t.column_id IN ?", columnIDs)

	var out []BoundRow
	err := db.Table("(?) AS ranked", sub).
		Where("rn = 1").
		Find(&out).Error
	return out, err
}

func GetOrderIndexExpr(fieldName string, tableAlias string) string {
	if fieldName == "" {
		fieldName = "order_index"
	}

	if tableAlias != "" {
		fieldName = strings.TrimRight(tableAlias, ".") + "." + fieldName
	}

	switch {
	case database.IsPostgres():
		// 使用 COALESCE 保证 NULL 一致性；按字节序比较
		return fmt.Sprintf(`%s COLLATE "C"`, fieldName)
	case database.IsMysql():
		// 若列本身是 *_bin 可简化为 t.order_index
		return fmt.Sprintf(`%s COLLATE ascii_bin`, fieldName)
	default:
		return fmt.Sprintf(`%s`, fieldName)
	}
}

func DecodeCursorTok(s string) (*CursorTok, error) {
	if s == "" {
		return &CursorTok{}, nil
	}
	var t CursorTok
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return &t, err
	}
	err = json.Unmarshal(b, &t)
	return &t, err
}

func intsToCSV(a []int64) string {
	if len(a) == 0 {
		return "NULL"
	}
	sb := strings.Builder{}
	for i, v := range a {
		if i > 0 {
			sb.WriteByte(',')
		}
		sb.WriteString(fmt.Sprintf("%d", v))
	}
	return sb.String()
}
