package model

type User struct {
	BaseModelWithUUID
	Nickname *string `json:"nickname" gorm:";default:NULL"`
	Password string  `json:"password" gorm:"not null"`
	Email    string  `json:"email" gorm:"unique;not null"`
	Phone    string  `json:"phone" gorm:"unique;not null"`
}
