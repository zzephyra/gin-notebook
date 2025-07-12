package dto

type BaseDto struct {
	OwnerID *int64 `json:"owner_id,string"` // 并且大于0
	ID      *int64 `json:"id,string"`       // 并且大于0
}

type ListResultDTO[T any] struct {
	Data  []T   `json:"data"`  // 列表数据
	Total int64 `json:"total"` // 总数
}
