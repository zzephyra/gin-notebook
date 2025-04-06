package auth

import "github.com/casbin/casbin/v2"

type UserEmailVerificationRequest struct {
	Email string `json:"email"`
}

type RBAC struct {
	enforcer *casbin.Enforcer
}
