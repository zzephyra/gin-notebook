package model

type UserRoleStructure struct {
	Admin string
	User  string
	Test  string
}

var UserRole = UserRoleStructure{
	Admin: "admin",
	User:  "user",
	Test:  "test",
}
