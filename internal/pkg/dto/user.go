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
	ID       int64   `json:"id,string" validate:"required;gt=0"`
	Nickname *string `json:"nickname" validate:"max=50,min=5"`
	Email    *string `json:"email" validate:"email"`
	Phone    *string `json:"phone" validate:"phone"`
	Avatar   *string `json:"avatar" validate:"url"`
	Password *string `json:"password" validate:"min=6,containsany=!@#$%"`
}
