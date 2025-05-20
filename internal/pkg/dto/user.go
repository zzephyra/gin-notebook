package dto

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
