package dto

type CreateUserValidation struct {
	Code     string `validate:"required"`
	Email    string `validate:"required,email"`
	Password string `validate:"required,min=6,containsany=!@#$%"`
}

type UserLoginValidation struct {
	Email    string `validate:"required,email"`
	Password string `validate:"required,min=6,containsany=!@#$%"`
}
