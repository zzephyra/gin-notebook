package database

import (
	"gin-notebook/configs"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresqlSql struct {
	Config *configs.Config
	Dsn    string
}

func (p *PostgresqlSql) GenerateDsn() {
	// 生成数据库连接字符串
	// 连接字符串格式: "host=localhost port=5432 user=postgres password=yourpassword dbname=yourdb sslmode=disable"
	p.Dsn = "host=" + p.Config.Database.Host +
		" port=" + p.Config.Database.Port +
		" user=" + p.Config.Database.User +
		" password=" + p.Config.Database.Password +
		" dbname=" + p.Config.Database.Database +
		" sslmode=disable"
}

func (p *PostgresqlSql) Connect() (*gorm.DB, error) {
	// 连接数据库
	db, err := gorm.Open(postgres.Open(p.Dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}
