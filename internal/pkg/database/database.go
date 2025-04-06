package database

import (
	"fmt"
	"gin-notebook/configs"
	"gin-notebook/internal/model"

	"gorm.io/gorm"
)

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
	)
}

func ConnectDB(c *configs.Config) {
	var db Database
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
