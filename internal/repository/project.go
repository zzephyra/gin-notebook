package repository

import (
	"context"
	"errors"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	CommentLikeActionInsert = "insert"
	CommentLikeActionSwitch = "switch"
	CommentLikeActionNoop   = "noop"
)

var (
	OrderByMapping = map[string]string{
		"created_at": "created_at",
		"updated_at": "updated_at",
		"priority":   "priority",
		"order":      "order_index",
	}
)

func CreateProjectTask(db *gorm.DB, taskModel *model.ToDoTask) error {
	err := db.Create(taskModel).Error
	return err
}

func GetLatestOrderByColumnID(db *gorm.DB, columnID int64, opts ...DatabaseExtraOpt) (string, error) {
	var maxOrder string
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}
	sql := db.Model(&model.ToDoTask{})

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	err := sql.Where("column_id = ?", columnID).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "order_index"}, Desc: true}).
		Limit(1).
		Select("order").
		Scan(&maxOrder).Error

	if err != nil {
		return "", err
	}
	return maxOrder, nil
}

func CreateProjectTaskAssignees(db *gorm.DB, assigneeModel *[]model.ToDoTaskAssignee) error {
	return db.Create(assigneeModel).Error
}

func GetProjectsByWorkspaceID(db *gorm.DB, workspaceID int64) ([]model.Project, error) {
	var projects []model.Project
	err := db.Where("workspace_id = ?", workspaceID).Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}

func ProjectExistsByID(db *gorm.DB, projectID int64, workspaceID int64) (bool, error) {
	var count int64
	err := db.Model(&model.Project{}).Where("id = ? AND workspace_id = ?", projectID, workspaceID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func GetProjectByID(db *gorm.DB, projectID, workspaceID int64) (*dto.ProjectDTO, error) {
	var project dto.ProjectDTO
	err := db.Table("projects p").
		Select(`p.id, p.name, p.description, p.owner_id, p.workspace_id, p.status, p.created_at, p.updated_at, p.icon,
            s.card_preview, s.is_public, s.is_archived, s.enable_comments, s.updated_at as setting_updated_at`).
		Joins("LEFT JOIN project_settings s ON s.project_id = p.id").
		Where("p.id = ? and p.workspace_id = ?", projectID, workspaceID).Find(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func GetColumnsBounded(db *gorm.DB, columnIDs []int64, field string, asc bool) (map[int64]CursorTok, error) {
	bounds := make(map[int64]CursorTok)
	if len(columnIDs) == 0 {
		return bounds, nil
	}
	if field == "" {
		field = "order_index"
	}

	dir := "ASC"
	if !asc {
		dir = "DESC"
	}

	// 构造列内排序（含稳定回退：order_index(字节序) + id）
	var innerOrderParts []string
	switch field {
	case "order_index":
		oi := GetOrderIndexExpr("order_index", "t")
		innerOrderParts = append(innerOrderParts, fmt.Sprintf("%s %s", oi, dir))
	case "priority":
		// priority 为整数语义；空值按 0
		innerOrderParts = append(innerOrderParts, fmt.Sprintf("COALESCE(t.%s, 0) %s", field, dir))
	default:
		innerOrderParts = append(innerOrderParts, fmt.Sprintf("t.%s %s", field, dir))
	}
	// innerOrderParts = append(innerOrderParts, GetOrderIndexExpr("order_index", "t")+" "+dir)
	innerOrderParts = append(innerOrderParts, "t.id"+" "+dir)
	innerOrder := strings.Join(innerOrderParts, ", ")

	// VALUES ($1::bigint),($2::bigint),...  —— 显式 ::bigint，避免 bigint=text 错误
	valuesPlaceholders := make([]string, 0, len(columnIDs))
	args := make([]any, 0, len(columnIDs))
	for i, id := range columnIDs {
		valuesPlaceholders = append(valuesPlaceholders, fmt.Sprintf("($%d::bigint)", i+1))
		args = append(args, id)
	}
	valuesSQL := strings.Join(valuesPlaceholders, ",")

	// LATERAL：对每个 column_id 单独 ORDER BY … LIMIT 1，天然“一列一条”
	q := fmt.Sprintf(`
		WITH cols(column_id) AS (
			VALUES %s
		)
		SELECT
			h.id,
			c.column_id,
			h.order_index,
			h.priority
		FROM cols c
		LEFT JOIN LATERAL (
			SELECT t.id, t.order_index, t.priority
			FROM to_do_tasks t
			WHERE t.deleted_at IS NULL
			  AND t.column_id = c.column_id
			ORDER BY %s
			LIMIT 1
		) AS h ON TRUE
	`, valuesSQL, innerOrder)

	var rows []headRow
	if err := db.Raw(q, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}

	// 组装边界游标：B1 统一 string；priority 转字符串
	for _, r := range rows {
		// 该列没有任务：LEFT LATERAL 会返回 id=NULL；按需决定是否保留空游标
		if r.ID == nil {
			// 若希望空列也返回空游标，可启用：
			// bounds[r.ColumnID] = CursorTok{B1: nil, BID: nil}
			continue
		}
		id := *r.ID
		switch field {
		case "priority":
			var s *string
			if r.Priority != nil {
				tmp := strconv.FormatUint(uint64(*r.Priority), 10)
				s = &tmp
			} else {
				z := "0" // 与 COALESCE 语义一致
				s = &z
			}
			bounds[r.ColumnID] = CursorTok{B1: s, BID: &id}
		default:
			if r.OrderIndex == nil {
				empty := ""
				bounds[r.ColumnID] = CursorTok{B1: &empty, BID: &id}
			} else {
				oi := *r.OrderIndex
				bounds[r.ColumnID] = CursorTok{B1: &oi, BID: &id}
			}
		}
	}

	return bounds, nil
}

// 排序字段类别
type colKind int

const (
	kindText     colKind = iota // 普通文本
	kindLexoText                // order_index（LexoRank，按字节序）
	kindTime                    // 时间（timestamp/datetime/date）
	kindInt                     // 数值（int/bigint/float 等
)

// 允许排序的列（按你的表调整/扩充）
var allowedOrderCols = map[string]colKind{
	"order_index": kindLexoText,
	"updated_at":  kindTime,
	"created_at":  kindTime,
	"deadline":    kindTime, // 若是 DATE 列也可用
	"priority":    kindInt,
	"status":      kindText,
	"title":       kindText,
	"id":          kindText, // 数值也可直接比较；仅用于兜底二级排序
}

func GetTasksByColumnsBounded(
	db *gorm.DB,
	columnIDs []int64,
	limitPerCol int,
	cursors map[int64]CursorTok, // {columnID: F1/FID/B1/BID}，值需与 orderBy 对应
	asc bool,
	orderBy string, // 排序列名
) ([]dto.ToDoTaskWithFlag, map[int64]ColPageInfo, error) {

	if limitPerCol <= 0 {
		limitPerCol = 20
	}
	if len(columnIDs) == 0 {
		return nil, map[int64]ColPageInfo{}, nil
	}

	// 1) 校验排序列
	kind, ok := allowedOrderCols[orderBy]
	if !ok {
		return nil, nil, fmt.Errorf("invalid orderBy column: %s", orderBy)
	}

	dir := "ASC"
	if !asc {
		dir = "DESC"
	}

	// 2) 生成排序 & 比较表达式
	var orderExpr, colL, f1R, b1R string

	switch {
	case database.IsPostgres():
		switch kind {
		case kindLexoText:
			orderExpr = fmt.Sprintf(`t.%s COLLATE "C"`, orderBy)
			colL = orderExpr
			f1R = `bound.f1 COLLATE "C"`
			b1R = `bound.b1 COLLATE "C"`
		case kindTime:
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			// 将游标文本转 timestamptz（若是 date 列可换 ::date）
			f1R = `CASE WHEN bound.f1 IS NULL THEN NULL ELSE (bound.f1)::timestamptz END`
			b1R = `CASE WHEN bound.b1 IS NULL THEN NULL ELSE (bound.b1)::timestamptz END`
		case kindInt:
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			// 将游标文本转 smallint（支持 uint8）
			f1R = `CASE WHEN bound.f1 IS NULL THEN NULL ELSE (bound.f1)::smallint END`
			b1R = `CASE WHEN bound.b1 IS NULL THEN NULL ELSE (bound.b1)::smallint END`
		default: // kindText
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			f1R = `bound.f1`
			b1R = `bound.b1`
		}

	case database.IsMysql():
		switch kind {
		case kindLexoText:
			orderExpr = fmt.Sprintf(`t.%s COLLATE ascii_bin`, orderBy)
			colL = orderExpr
			f1R = `BOUND.f1 COLLATE ascii_bin`
			b1R = `BOUND.b1 COLLATE ascii_bin`
		case kindTime:
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			// 将游标文本转 DATETIME（如为 DATE，可 CAST(... AS DATE)）
			f1R = `CAST(BOUND.f1 AS DATETIME)`
			b1R = `CAST(BOUND.b1 AS DATETIME)`
		case kindInt:
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			// 将游标文本转无符号整数（兼容 uint8）
			f1R = `CAST(BOUND.f1 AS UNSIGNED)`
			b1R = `CAST(BOUND.b1 AS UNSIGNED)`
		default: // kindText
			orderExpr = fmt.Sprintf(`t.%s`, orderBy)
			colL = orderExpr
			f1R = `BOUND.f1`
			b1R = `BOUND.b1`
		}

	default:
		// 兜底（本地 sqlite 等），按文本比较
		orderExpr = fmt.Sprintf(`t.%s`, orderBy)
		colL = orderExpr
		f1R = `bound.f1`
		b1R = `bound.b1`
	}

	// 3) 为每个列构造一行 bound（没游标也要 NULL 行，避免 JOIN 丢列）
	type bRow struct {
		ColumnID int64
		F1       *string
		FID      *int64
		B1       *string
		BID      *int64
	}
	bounds := make([]bRow, 0, len(columnIDs))
	for _, cid := range columnIDs {
		if tok, ok := cursors[cid]; ok {
			bounds = append(bounds, bRow{cid, tok.F1, tok.FID, tok.B1, tok.BID})
		} else {
			bounds = append(bounds, bRow{ColumnID: cid})
		}
	}

	// 4) 生成 bound 子表 SQL + 参数
	var boundSQL string
	var boundArgs []any

	if database.IsPostgres() {
		rows := make([]string, 0, len(bounds))
		for range bounds {
			// f1/b1 作为 text 注入，后续按列类型 CAST
			rows = append(rows, "(?::bigint, ?::text, ?::bigint, ?::text, ?::bigint)")
		}
		boundSQL = fmt.Sprintf(
			"LEFT JOIN (VALUES %s) AS bound(column_id, f1, fid, b1, bid) ON bound.column_id = t.column_id",
			strings.Join(rows, ","),
		)
		for _, b := range bounds {
			boundArgs = append(boundArgs, b.ColumnID, b.F1, b.FID, b.B1, b.BID)
		}
	} else { // MySQL 8.0+
		parts := make([]string, 0, len(bounds))
		for range bounds {
			parts = append(parts, "SELECT ? AS column_id, ? AS f1, ? AS fid, ? AS b1, ? AS bid")
		}
		boundSQL = fmt.Sprintf(
			"LEFT JOIN ( %s ) AS BOUND ON BOUND.column_id = t.column_id",
			strings.Join(parts, " UNION ALL "),
		)
		for _, b := range bounds {
			boundArgs = append(boundArgs, b.ColumnID, b.F1, b.FID, b.B1, b.BID)
		}
		// 同步标识符
		f1R = strings.ReplaceAll(f1R, "bound.", "BOUND.")
		b1R = strings.ReplaceAll(b1R, "bound.", "BOUND.")
	}

	// 5) 上下界谓词（与排序方向一致；等值时用 id 作稳定比较）
	var lowerOK, upperOK string
	if asc {
		lowerOK = fmt.Sprintf(`( %s IS NULL OR %s > %s OR (%s = %s AND (bound.fid IS NULL OR t.id > bound.fid)) )`,
			f1R, colL, f1R, colL, f1R)
		upperOK = fmt.Sprintf(`( %s IS NULL OR %s < %s OR (%s = %s AND (bound.bid IS NULL OR t.id <= bound.bid)) )`,
			b1R, colL, b1R, colL, b1R)
	} else {
		lowerOK = fmt.Sprintf(`( %s IS NULL OR %s < %s OR (%s = %s AND (bound.fid IS NULL OR t.id < bound.fid)) )`,
			f1R, colL, f1R, colL, f1R)
		upperOK = fmt.Sprintf(`( %s IS NULL OR %s > %s OR (%s = %s AND (bound.bid IS NULL OR t.id >= bound.bid)) )`,
			b1R, colL, b1R, colL, b1R)
	}

	// 6) 主查询（窗口：rn + total_count）
	q := fmt.Sprintf(`
        WITH ranked AS (
          SELECT
            t.*,
            ROW_NUMBER() OVER (
              PARTITION BY t.column_id
              ORDER BY %s %s, t.id %s
            ) AS rn,
            COUNT(*) OVER (PARTITION BY t.column_id) AS total_count
          FROM to_do_tasks t
          %s
          WHERE t.deleted_at IS NULL
            AND t.column_id IN (?)
            AND (%s)
            AND (%s)
            AND t.%s IS NOT NULL
        )
        SELECT * FROM ranked
        WHERE rn <= ?
    `, orderExpr, dir, dir, boundSQL, lowerOK, upperOK, orderBy)

	// 7) 参数组装：先 boundArgs，再 columnIDs，再 limit
	args := make([]any, 0, len(boundArgs)+2)
	args = append(args, boundArgs...)
	args = append(args, columnIDs)
	args = append(args, limitPerCol)

	// 8) 执行
	var rows []dto.ToDoTaskWithFlag
	if err := db.Debug().Raw(q, args...).Scan(&rows).Error; err != nil {
		return nil, nil, err
	}

	// 9) 汇总分页信息
	page := make(map[int64]ColPageInfo, len(columnIDs))
	for _, cid := range columnIDs {
		page[cid] = ColPageInfo{Total: 0, HasNext: false}
	}
	maxRN := make(map[int64]int, len(columnIDs))
	for _, r := range rows {
		cid := r.ToDoTask.ColumnID
		info := page[cid]
		info.Total = r.TotalCount
		if r.Rn > maxRN[cid] {
			maxRN[cid] = r.Rn
		}
		page[cid] = info
	}
	for cid, info := range page {
		if info.Total > maxRN[cid] {
			info.HasNext = true
			page[cid] = info
		}
	}

	return rows, page, nil
}

func GetFirstOrderIndexInColumn(ctx context.Context, db *gorm.DB, columnID int64) (string, error) {
	var orderIndex string

	q := db.Model(&model.ToDoTask{}).
		Select("order_index").
		Where("column_id = ?", columnID).
		Limit(1)

	switch db.Dialector.Name() {
	case "postgres":
		// 用纯字节序排序
		q = q.Order(clause.Expr{SQL: `order_index COLLATE "C" ASC`})
	case "mysql":
		// 二进制排序，大小写敏感
		q = q.Order(clause.Expr{SQL: "order_index COLLATE utf8mb4_bin ASC"})
	default:
		// 兜底：仍然显式 ASC，但建议从根上设置正确 collation
		q = q.Order("order_index ASC")
	}

	if err := q.Scan(&orderIndex).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}
	return orderIndex, nil
}

func ternary[T any](cond bool, a, b T) T {
	if cond {
		return a
	}
	return b
}

func GetProjectColumnsByProjectID(db *gorm.DB, projectID int64, columnIDs *[]int64) ([]model.ToDoColumn, error) {
	var columns []model.ToDoColumn
	sql := db.Where("project_id = ?", projectID)

	fmt.Println(columnIDs)
	if columnIDs != nil && len(*columnIDs) > 0 {
		sql = sql.Where("id IN ?", *columnIDs)
	}

	sql = sql.Find(&columns)
	if err := sql.Error; err != nil {
		return nil, err
	}
	return columns, nil
}

func GetProjectColumnsByProjectName(db *gorm.DB, projectName string, workspaceID int64, columnIDs *[]int64) ([]model.ToDoColumn, error) {
	var columns []model.ToDoColumn
	sql := db.Where(
		"project_id = (?)",
		db.Model(&model.Project{}).Where(
			"workspace_id = ? AND (name = ? OR (is_default = TRUE AND NOT EXISTS (?)))",
			workspaceID, projectName,
			db.Model(
				&model.Project{}).Select("1").Where("workspace_id = ? and name = ?", workspaceID, projectName),
		).Select("id").Limit(1),
	)

	if columnIDs != nil && len(*columnIDs) > 0 {
		sql = sql.Where("id IN ?", *columnIDs)
	}

	sql = sql.Find(&columns)
	if err := sql.Error; err != nil {
		return nil, err
	}
	return columns, nil
}

func GetDefaultProjectByWorkspaceID(db *gorm.DB, workspaceID int64) (*model.Project, error) {
	var project model.Project
	sql := db.Where("workspace_id = ? AND is_default = ?", workspaceID, true).First(&project)
	if err := sql.Error; err != nil {
		return nil, err
	}
	return &project, nil
}

// 按列分页：每个 column_id 各自取 [offset, offset+limit) 这段
func GetProjectTasksByColumns(db *gorm.DB, columnIDs []int64, limit, offset int) ([]dto.ToDoTaskWithFlag, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// 统一生成 LexoRank 的排序表达式（按字节序 + id 兜底）
	getOrderExpr := func() string {
		switch {
		case database.IsPostgres():
			return `order_index COLLATE "C" ASC, id ASC`
		case database.IsMysql():
			return `order_index COLLATE ascii_bin ASC, id ASC` // 若列定义已是 *_bin，可简化为 order_index ASC, id ASC
		default:
			return `order_index ASC, id ASC`
		}
	}

	orderExpr := getOrderExpr()

	query := fmt.Sprintf(`
		WITH ranked AS (
			SELECT
				t.*,
				ROW_NUMBER() OVER (PARTITION BY t.column_id ORDER BY %s) AS rn,
				COUNT(*)    OVER (PARTITION BY t.column_id) AS total_count
			FROM to_do_tasks AS t
			WHERE t.deleted_at IS NULL
			  AND t.column_id IN (?)
		)
		SELECT *
		FROM ranked
		WHERE rn > ? AND rn <= ?;
	`, orderExpr)

	var tasks []dto.ToDoTaskWithFlag
	if err := db.Raw(query, columnIDs, offset, offset+limit).Scan(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func GetProjectTaskByID(db *gorm.DB, taskID int64, opts ...DatabaseExtraOpt) (*model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task model.ToDoTask
	sql := db.Where("id = ?", taskID)

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	if err := sql.First(&task).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func GetProjectTaskByIDs(db *gorm.DB, taskID []int64, opts ...DatabaseExtraOpt) ([]model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task []model.ToDoTask
	sql := db.Model(&model.ToDoTask{}).
		Where("id IN ?", taskID).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "order_index"}})

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	err := sql.Scan(&task).Error
	if err != nil {
		return nil, err
	}
	return task, nil
}

func GetProjectTaskAssigneesByTaskIDs(db *gorm.DB, taskIDs []int64) ([]dto.ToDoTaskAssignee, error) {
	var assignees []dto.ToDoTaskAssignee

	err := db.Model(&model.ToDoTaskAssignee{}).
		Select("to_do_task_assignees.to_do_task_id, u.nickname, u.email AS email, wm.id, u.avatar, wm.nickname as workspace_nickname").
		Joins("JOIN workspace_members wm ON wm.id = to_do_task_assignees.assignee_id").
		Joins("JOIN users u ON u.id =  wm.user_id").
		Where("to_do_task_assignees.to_do_task_id IN ?", taskIDs).Scan(&assignees).Error
	if err != nil {
		return nil, err
	}

	return assignees, nil
}

func UpdateTaskByTaskID(
	db *gorm.DB, taskID int64, ifMatchUpdatedAt time.Time, data map[string]interface{},
) (task *model.ToDoTask, err error, conflicted bool) {
	data["updated_at"] = gorm.Expr("NOW()")

	res := db.Model(&model.ToDoTask{}).
		Where("id = ? AND updated_at = ?", taskID, ifMatchUpdatedAt).
		Updates(data)

	if res.Error != nil {
		return nil, res.Error, false
	}
	if res.RowsAffected == 0 {
		var t model.ToDoTask
		if err := db.Select("id, updated_at").First(&t, taskID).Error; err != nil {
			return nil, err, true
		}
		return &t, nil, true
	}
	var t model.ToDoTask
	if err := db.First(&t, taskID).Error; err != nil {
		return nil, err, false
	}
	return &t, nil, false
}

func RemoveTaskAssigneesByTaskIDAndMemberIDs(db *gorm.DB, taskID int64, memberIDs []int64) error {
	// 由于设置了联合唯一索引，为了兼容MySQL和PostgreSQL，这里采用硬删除
	if len(memberIDs) == 0 {
		return nil // 如果没有用户ID，直接返回
	}
	return db.Unscoped().Where("to_do_task_id = ? AND assignee_id IN ?", taskID, memberIDs).Delete(&model.ToDoTaskAssignee{}).Error
}

func CheckWorkspaceMemberAuth(db *gorm.DB, workspaceID, userID, memberID int64) (bool, error) {
	var count int64
	err := db.Model(&model.WorkspaceMember{}).
		Where("workspace_id = ? AND user_id = ? AND id = ?", workspaceID, userID, memberID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func DeleteProjectColumnTasksByID(db *gorm.DB, columnID, projectID int64, hard bool) error {
	sql := db.Where("column_id = ? AND project_id = ?", columnID, projectID).Delete(&model.ToDoTask{})

	if hard {
		sql = sql.Unscoped()
	}

	return sql.Error
}

func GetFirstTask(db *gorm.DB, columnID int64, opts ...DatabaseExtraOpt) (*model.ToDoTask, error) {
	option := &DatabaseExtraOptions{}
	for _, o := range opts {
		o(option)
	}

	var task model.ToDoTask
	sql := db.Where("column_id = ?", columnID).
		Order(GetLexoRankOrderExpr(false)).
		Limit(1).
		First(&task)

	if option.WithLock {
		sql = sql.Clauses(clause.Locking{Strength: "UPDATE"})
	}

	if sql.Error != nil {
		return nil, sql.Error
	}
	return &task, nil
}

func GetLexoRankOrderExpr(desc bool) string {
	var dir string
	if desc {
		dir = "DESC"
	} else {
		dir = "ASC"
	}

	switch {
	case database.IsPostgres():
		return fmt.Sprintf(`order_index COLLATE "C" %s, id %s`, dir, dir)
	case database.IsMysql():
		// 如果列本身是 ascii_bin/utf8mb4_bin，可以直接 order_index %s
		return fmt.Sprintf(`order_index COLLATE ascii_bin %s, id %s`, dir, dir)
	default:
		return fmt.Sprintf(`order_index %s, id %s`, dir, dir)
	}
}

func UpdateProjectColumnByID(db *gorm.DB, columnID int64, ifMatchUpdatedAt time.Time, data map[string]interface{}) (column *model.ToDoColumn, err error, conflicted bool) {
	data["updated_at"] = gorm.Expr("NOW()")

	res := db.Model(&model.ToDoColumn{}).
		Where("id = ? AND updated_at = ?", columnID, ifMatchUpdatedAt).
		Updates(data)

	if res.Error != nil {
		return nil, res.Error, false
	}
	if res.RowsAffected == 0 {
		var c model.ToDoColumn
		if err := db.Select("id, updated_at").First(&c, columnID).Error; err != nil {
			return nil, err, true
		}
		return &c, nil, true
	}
	var c model.ToDoColumn
	if err := db.First(&c, columnID).Error; err != nil {
		return nil, err, false
	}
	return &c, nil, false
}

func GetProjectTaskActivitiesByTaskID(db *gorm.DB, taskID int64, limit, offset int, start, end *time.Time) ([]dto.KanbanActivityDTO, int64, error) {
	var activities []dto.KanbanActivityDTO

	if offset < 0 {
		offset = 0
	}
	if limit <= 0 || limit > 30 {
		limit = 20
	}

	sql := db.
		Model(&model.KanbanActivity{}).
		Where("task_id = ? AND success = true", taskID).
		Joins("LEFT JOIN workspace_members wm ON wm.id = kanban_activity.member_id").
		Joins("LEFT JOIN users u ON u.id = wm.user_id").
		Select("kanban_activity.*, u.nickname AS user_nickname, wm.nickname AS member__nickname, u.avatar as avatar, u.email as email").
		Order("created_at DESC")

	if start != nil {
		sql = sql.Where("kanban_activity.created_at >= ?", start.UTC())
	}
	if end != nil {
		sql = sql.Where("kanban_activity.created_at <= ?", end.UTC())
	}

	var total int64
	if err := sql.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sql = sql.Offset(offset).Limit(limit)

	if err := sql.Find(&activities).Error; err != nil {
		return nil, 0, err
	}
	return activities, total, nil
}

func GetTaskCommentLikeByMemberID(db *gorm.DB, commentID, memberID int64) *model.ToDoCommentLike {
	var memberLikeModel = model.ToDoCommentLike{}
	err := db.Model(&model.ToDoCommentLike{}).
		Where("comment_id = ? AND member_id = ?", commentID, memberID).
		Find(&memberLikeModel).Error
	if err != nil {
		return nil
	}
	return &memberLikeModel
}

func CreateOrUpdateCommentLike(db *gorm.DB, likeModel *model.ToDoCommentLike) (string, error) {
	// Step 1: 尝试插入（冲突则 DoNothing）
	res := db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "comment_id"}, {Name: "member_id"}},
		DoNothing: true,
	}).Create(likeModel)

	if res.Error != nil {
		return "", res.Error
	}
	if res.RowsAffected == 1 {
		return CommentLikeActionInsert, nil
	}

	// Step 2: 尝试恢复软删记录
	restore := db.Model(&model.ToDoCommentLike{}).
		Unscoped().
		Where("comment_id = ? AND member_id = ? AND (deleted_at IS NOT NULL OR is_like <> ?)", likeModel.CommentID, likeModel.MemberID, likeModel.IsLike).
		Updates(map[string]any{
			"is_like":    likeModel.IsLike,
			"deleted_at": nil,
			"updated_at": gorm.Expr("NOW()"),
		})

	if restore.Error != nil {
		return "", restore.Error
	}
	if restore.RowsAffected == 1 {
		return CommentLikeActionSwitch, nil
	}

	// Step 4: 同值重复点击 → noop
	return CommentLikeActionNoop, nil
}

func IncCommentCounters(db *gorm.DB, commentID int64, dLikes, dDislikes int) (data *dto.LikeCommentDTO, err error) {
	out := dto.LikeCommentDTO{}
	err = db.Model(&model.ToDoTaskComment{}).
		Where("id = ?", commentID).
		Updates(map[string]any{
			"likes":      gorm.Expr("GREATEST(likes + ?, 0)", dLikes),
			"dislikes":   gorm.Expr("GREATEST(dislikes + ?, 0)", dDislikes),
			"updated_at": gorm.Expr("NOW()"),
		}).Error

	if err == nil {
		err = db.Model(&model.ToDoTaskComment{}).
			Select("likes", "dislikes").
			Where("id = ?", commentID).
			Scan(&out).Error
	}
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func DeleteCommentLike(db *gorm.DB, commentID, memberID int64) (string, error) {
	var like model.ToDoCommentLike
	if err := db.Where("comment_id = ? AND member_id = ?", commentID, memberID).First(&like).Error; err != nil {
		return "", err
	}

	// 软删除
	if err := db.Delete(&like).Error; err != nil {
		return "", err
	}

	// 返回动作类型，方便调用层更新计数
	if like.IsLike {
		return "unlike", nil
	}
	return "undislike", nil
}

func DeleteProjectTaskByID(db *gorm.DB, taskID, workspaceID, memberID int64) error {
	// 软删除任务
	task := &model.ToDoTask{
		BaseModel: model.BaseModel{
			ImmutableBaseModel: model.ImmutableBaseModel{
				ID: taskID,
			},
		},
	}
	err := DeleteModel(db, task)
	if err != nil {
		return err
	}
	return nil
}
