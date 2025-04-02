package model

type Role struct {
	BaseModel
	RoleName string `json:"role_name" gorm:"type:varchar(20);unique;not null" validate:"required,min=1,max=20"`
	RoleDesc string `json:"role_desc" gorm:"type:varchar(300)"`
}

type RoleRelateUser struct {
	BaseModel
	UserUUID uint `json:"user_uuid" gorm:"index: user_role_index;not null"`
	RoleID   uint `json:"role_id" gorm:"index: user_role_index;not null"`
}
