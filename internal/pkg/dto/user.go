package dto

import "github.com/oschwald/geoip2-golang"

type CreateUserDTO struct {
	Code     string `validate:"required"`
	Email    string `validate:"required,email"`
	Password string `validate:"required,min=6,containsany=!@#$%"`
}

type UserLoginDTO struct {
	Email    string `validate:"required,email"`
	Password string `validate:"required,min=6,containsany=!@#$%"`
}

type UserUpdateDTO struct {
	ID       int64   `json:"id,string" validate:"required,gt=0"`
	Nickname *string `json:"nickname" validate:"omitempty,max=50,min=5"`
	Email    *string `json:"email" validate:"omitempty,email"`
	Phone    *string `json:"phone" validate:"omitempty,e164"`
	Avatar   *string `json:"avatar" validate:"omitempty,url"`
	Password *string `json:"password" validate:"omitempty,min=6"`
}

type UserDeviceCreateDTO struct {
	UserID      int64        `json:"user_id,string" validate:"required,gt=0"`
	Fingerprint string       `json:"fingerprint" validate:"required"`
	Os          string       `json:"os" validate:"required"`
	Device      string       `json:"device" validate:"required"`
	UserAgent   string       `json:"ua" validate:"required"`
	IP          string       `json:"ip" validate:"required"`
	Location    *geoip2.City `json:"location" validate:"required"`
}

type UserDeviceListDTO struct {
	UserID int64 `json:"user_id,string" validate:"required,gt=0"`
	Offset int   `form:"offset" validate:"omitempty,min=0"`
	Limit  int   `form:"limit" validate:"omitempty,min=3,max=5"`
}
