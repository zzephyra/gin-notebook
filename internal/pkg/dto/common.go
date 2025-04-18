package dto

type BaseDto struct {
	OwnerID *int64 `json:"owner_id" validate:"gt=0"`    // 并且大于0
	ID      int64  `json:"id" validate:"required,gt=0"` // 必须存在，并且大于0
}
