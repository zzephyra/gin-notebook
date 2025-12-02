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
		&model.FavoriteNote{},
		&model.AISession{},
		&model.AIMessage{},
		&model.Event{},
		&model.TemplateNote{},
		&model.Project{},
		&model.ToDoColumn{},
		&model.ToDoTask{},
		&model.ToDoTaskAssignee{},
		&model.ToDoTaskComment{},
		&model.ToDoCommentMention{},
		&model.ToDoCommentAttachment{},
		&model.ToDoCommentLike{},
		&model.KanbanActivity{},
		&model.ProjectSetting{},
		&model.NoteExternalLink{},
		&model.IntegrationAccount{},
		&model.IntegrationApp{},
		&model.OutboxEvent{},
		&model.NoteExternalNodeMapping{},
		&model.ScheduledTask{},
		&model.SyncOutbox{},
		&model.AiPrompt{},
		&model.AiPromptVersion{},
		&model.AIActionExposure{},
		&model.Document{},
		&model.Chunk{},
		&model.Outbox{},
	)
}

func ConnectDB(c *configs.Config, migrateDB bool) {
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

	if migrateDB {
		Migrate(conn)
	}

	var exists bool

	err = conn.Raw(`
        SELECT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname = 'uniq_default_project_per_workspace'
        );
    `).Scan(&exists).Error
	if err != nil {
		return
	}

	// 如果不存在则创建
	if !exists {
		err = conn.Exec(`
            CREATE UNIQUE INDEX uniq_default_project_per_workspace
            ON public.projects (workspace_id)
            WHERE is_default = true AND deleted_at IS NULL;
        `).Error
		if err != nil {
			return
		}
	}

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

func IsPostgres() bool {
	return Engine == "postgres"
}

func IsMysql() bool {
	return Engine == "mysql"
}
