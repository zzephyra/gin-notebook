package model

type User struct {
	BaseModel
	Nickname *string `json:"nickname" gorm:";default:NULL"`
	Password string  `json:"password" gorm:"not null"`
	Email    string  `json:"email" gorm:"unique;not null"`
	Phone    string  `json:"phone" gorm:"unique;default:NULL"`
	Avatar   string  `json:"avatar" gorm:"default:NULL"`
}
