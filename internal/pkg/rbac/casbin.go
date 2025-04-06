package rbac

import (
	"gin-notebook/configs"
	"strconv"

	pgadapter "github.com/casbin/casbin-pg-adapter"
	"github.com/casbin/casbin/v2"
)

var (
	USER  = "user"
	ADMIN = "admin"
)

var Enforcer *casbin.Enforcer

func GenerateDsn() string {
	var db = configs.Configs.Database
	return "postgresql://" + db.User + ":" + db.Password + "@" + db.Host + ":" + db.Port + "/" + db.Database + "?sslmode=disable"
}

func NewEnforcer() error {
	var err error
	a, _ := pgadapter.NewAdapter(GenerateDsn(), configs.Configs.Database.Database)
	Enforcer, err = casbin.NewEnforcer("configs/rbac_model.conf", a)

	if err != nil {
		return err
	}
	Enforcer.LoadPolicy()
	return nil
}

func SetUserRole(userId int64, roleName string) error {
	// 设置用户角色
	Enforcer.GetAllRoles()
	_, err := Enforcer.AddRoleForUser(strconv.FormatInt(userId, 10), roleName)
	if err != nil {
		return err
	}
	Enforcer.SavePolicy()
	return nil
}

func GetUserRole(userId string) ([]string, error) {
	// 获取用户角色
	roles, err := Enforcer.GetRolesForUser(userId)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func GetUserPermissions(userId string) ([][]string, error) {
	// 获取用户权限
	permissions, err := Enforcer.GetPermissionsForUser(userId)
	if err != nil {
		return nil, err
	}
	return permissions, nil
}
