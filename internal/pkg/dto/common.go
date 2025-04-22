package dto

type BaseDto struct {
	OwnerID *int64 `json:"owner_id,string"` // 并且大于0
	ID      *int64 `json:"id,string"`       // 并且大于0
}
