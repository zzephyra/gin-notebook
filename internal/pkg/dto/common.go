package dto

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type BaseDto struct {
	OwnerID *int64 `json:"owner_id,string"` // 并且大于0
	ID      *int64 `json:"id,string"`       // 并且大于0
}

type ListResultDTO[T any] struct {
	Data  []T   `json:"data"`  // 列表数据
	Total int64 `json:"total"` // 总数
}

type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("StringArray: failed to assert value to []byte")
	}
	return json.Unmarshal(bytes, a)
}

func (a StringArray) Value() (driver.Value, error) {
	return json.Marshal(a)
}
