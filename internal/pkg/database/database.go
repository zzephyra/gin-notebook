package database

import (
	"errors"
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/internal/http/message"
	"gin-notebook/internal/model"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

var Engine = ""
var DB *gorm.DB

type Database interface {
	Connect() (*gorm.DB, error)
	GenerateDsn()
}

func Migrate(db *gorm.DB) {
	// 迁移数据库
	fmt.Println("开始迁移数据库")
	db.AutoMigrate(
		&model.User{},
		&model.Workspace{},
		&model.WorkspaceMember{},
		&model.WorkspaceInvite{},
		&model.Note{},
		&model.NoteTag{},
		&model.NoteCategory{},
		&model.SystemSetting{},
		&model.UserSetting{},
		&model.UserDevice{},
	)
}

func ConnectDB(c *configs.Config) {
	var db Database
	Engine = c.Database.Engine
	if c.Database.Engine == "postgres" {
		db = &PostgresqlSql{
			Config: c,
		}
	} else {
		// 默认使用 Postgresql, 防止未选择数据库而导致 panic
		db = &PostgresqlSql{
			Config: c,
		}
	}
	db.GenerateDsn()

	conn, err := db.Connect()
	if err != nil {
		panic(err)
	}
	Migrate(conn)
	DB = conn
}

func isPostgresError(err error) int {
	if err == nil {
		return message.SUCCESS
	}
	var pgErr *pgconn.PgError

	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return message.ERROR_USER_EMAIL_EXIST
		case "23503":
			return message.ERROR_USER_NOT_EXIST
		default:
			return message.ERROR_DATABASE
		}
	}
	return message.ERROR_DATABASE
}

func IsError(err error) int {
	switch Engine {
	case "postgres":
		return isPostgresError(err)
	default:
		return isPostgresError(err)
	}
}
