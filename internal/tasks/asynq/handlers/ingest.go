package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	asynqSingleton "gin-notebook/internal/tasks/asynq/singleton"
	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/internal/tasks/contracts"
	"gin-notebook/pkg/utils/tools"
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/hibiken/asynq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func HandleIngestNote(ctx context.Context, t *asynq.Task) error {
	var p types.IngestNotePayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return err
	}

	// RLS：服务账号/worker 设置
	// 这里用 workspace_id/owner_user_id 作为 LOCAL 变量。服务账号具有读取 notes 的权限。
	tx := database.DB.Session(&gorm.Session{NewDB: true}).Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Exec("SET LOCAL app.user_id = ?", p.OwnerUserID).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Exec("SET LOCAL app.workspace_id = ?", p.WorkspaceID).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 1) 读取 note
	var note struct {
		ID          int64
		Title       string
		WorkspaceID int64
		ProjectID   *int64
		OwnerID     int64
		Status      string
		Content     datatypes.JSON
		Version     int64
	}
	if err := tx.Table("notes").Where("id = ?", p.NoteID).First(&note).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return asynq.SkipRetry
		} // 已删
		return err
	}

	// 幂等：若携带 version，可快速判断略过
	if p.Version > 0 && note.Version > 0 && p.Version != note.Version {
		// 队尾旧任务，跳过
		tx.Rollback()
		return nil
	}

	// 2) 计算哈希
	hash := Sha256CanonicalJSON(note.Content) // 你已有实现
	metaBytes, _ := json.Marshal(map[string]any{"note_id": note.ID})

	// 3) upsert document（workspace_id + content_hash）
	doc := model.Document{
		WorkspaceID: note.WorkspaceID,
		ProjectID:   note.ProjectID,
		OwnerUserID: note.OwnerID,
		Visibility:  model.Visibility(note.Status),
		Source:      "local",
		ExternalID:  fmt.Sprintf("note:%d", note.ID),
		Title:       note.Title,
		Metadata:    metaBytes,
		ContentHash: hash,
		IsActive:    true,
	}

	// 为了复用旧 id：先查一次（可避免“新 id 覆盖老 id”）
	var existingID int64
	err := tx.Table("rag_documents").
		Select("id").
		Where("workspace_id = ? AND content_hash = ? AND deleted_at IS NULL", note.WorkspaceID, hash).
		Take(&existingID).Error
	if err == nil {
		doc.ID = existingID
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		return err
	}

	if err := tx.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "workspace_id"}, {Name: "content_hash"}},
		DoUpdates: clause.Assignments(map[string]any{
			"title":      doc.Title,
			"visibility": doc.Visibility,
			"is_active":  true,
			"updated_at": gorm.Expr("now()"),
		}),
	}).Create(&doc).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 4) 删除旧 chunks
	if err := tx.Where("document_id = ?", doc.ID).Delete(&model.Chunk{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 5) 分块（标题感知 + 重叠）
	lines := FlattenNoteBlocks(note.Content)          // []string
	chunks := ChunkByHeadingAndSize(lines, 1200, 200) // []string

	// 6) 批量写入（embedding=NULL + 冗余文档列）
	batch := make([]model.Chunk, 0, len(chunks))
	for i, txt := range chunks {
		batch = append(batch, model.Chunk{
			DocumentID:   doc.ID,
			WorkspaceID:  doc.WorkspaceID,
			ProjectID:    doc.ProjectID,
			OwnerUserID:  doc.OwnerUserID,
			Visibility:   doc.Visibility,
			Idx:          i,
			Text:         txt,
			Embedding:    nil,
			Metadata:     nil,
			DocTitle:     doc.Title,
			DocIsActive:  tools.Ptr(true),
			DocDeletedAt: nil,
		})
	}
	if len(batch) > 0 {
		if err := tx.CreateInBatches(&batch, 500).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 7) 投递 embed 子任务（使用 document_id，Worker 自己查询 embedding=NULL 的 chunks）
	payload := types.EmbedChunkPayload{
		DocumentID: doc.ID,
	}

	b, _ := json.Marshal(payload)

	asynqSingleton.Dispatcher().Enqueue(ctx, types.EmbedChunkKey, b,
		contracts.WithQueue(types.QIngest),
		contracts.WithTimeout(300),
		contracts.WithMaxRetry(3),
	)

	return err
}

func extractInlineText(raw []dto.InlineDTO) string {
	if len(raw) == 0 {
		return ""
	}

	var sb strings.Builder
	for _, it := range raw {
		sb.WriteString(it.Text)
	}
	return sb.String()
}

func FlattenNoteBlocks(content any) []string {
	var raw []byte
	switch t := content.(type) {
	case []byte:
		raw = t
	case json.RawMessage:
		raw = []byte(t)
	case datatypes.JSON:
		raw = []byte(t)
	case string:
		raw = []byte(t)
	default:
		// 尝试编码
		b, err := json.Marshal(t)
		if err != nil {
			return nil
		}
		raw = b
	}

	var blocks []dto.NoteBlockDTO
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.UseNumber()
	if err := dec.Decode(&blocks); err != nil {
		// 不是数组，直接当做纯文本
		text := strings.TrimSpace(string(raw))
		if text == "" {
			return nil
		}
		return []string{text}
	}

	out := make([]string, 0, len(blocks))
	for _, b := range blocks {
		line := extractInlineText(b.Content)
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		switch strings.ToLower(b.Type) {
		case "heading":
			lv := 2
			if b.Props.Level != nil {
				lv = *b.Props.Level
			}
			if lv < 1 {
				lv = 1
			}
			if lv > 6 {
				lv = 6
			}
			prefix := strings.Repeat("#", lv) + " "
			out = append(out, prefix+line)

		case "quote":
			// 简化：整块作为一行，前缀 "> "
			out = append(out, "> "+line)

		default:
			// paragraph | code | list-item ……都以纯文本处理
			out = append(out, line)
		}
	}
	return out
}

// ---------- Chunking ----------

// ChunkByHeadingAndSize 将行序列切成若干 chunk：
// - 遇到 heading（以 '#' 开头）优先切块（若当前缓冲非空则先落块，再以 heading 作为新起点）
// - 累积字符数 >= maxChars 时强行切块
// - overlap: 每次切块后保留尾部 overlap 个字符进入下一块（避免语义断裂）
// 注意：此函数按字符数切，不保证按行对齐；若更在意行对齐，可自行改为按行长度阈值。
func ChunkByHeadingAndSize(lines []string, maxChars, overlap int) []string {
	if maxChars <= 0 {
		maxChars = 1200
	}
	if overlap < 0 {
		overlap = 0
	}
	var chunks []string
	var buf strings.Builder

	flush := func(cutBy string) {
		text := strings.TrimSpace(buf.String())
		if text == "" {
			return
		}
		chunks = append(chunks, text)
		if overlap > 0 {
			// 取尾部 overlap 字符作为下一段的起点
			runes := []rune(text)
			start := int(math.Max(0, float64(len(runes)-overlap)))
			buf.Reset()
			buf.WriteString(string(runes[start:]))
		} else {
			buf.Reset()
		}
		_ = cutBy // 你可把 cutBy 记录到 metadata
	}

	for _, ln := range lines {
		trim := strings.TrimSpace(ln)
		// 若是标题行，作为强边界
		if strings.HasPrefix(trim, "#") {
			if buf.Len() > 0 {
				flush("heading")
			}
			// 标题直接作为下一块的起点
			if buf.Len() > 0 {
				buf.WriteString("\n")
			}
			buf.WriteString(trim)
			buf.WriteString("\n")
			continue
		}

		if buf.Len() > 0 {
			buf.WriteString("\n")
		}
		buf.WriteString(trim)

		if buf.Len() >= maxChars {
			flush("size")
		}
	}
	if buf.Len() > 0 {
		flush("tail")
	}
	return chunks
}

func Sha256CanonicalJSON(v any) string {
	var val any
	switch t := v.(type) {
	case []byte:
		if err := json.Unmarshal(t, &val); err != nil {
			// 如果不是 JSON，就当作字节直接 hash
			sum := sha256.Sum256(t)
			return hex(sum[:])
		}
	case json.RawMessage:
		if err := json.Unmarshal([]byte(t), &val); err != nil {
			sum := sha256.Sum256([]byte(t))
			return hex(sum[:])
		}
	case datatypes.JSON:
		if err := json.Unmarshal([]byte(t), &val); err != nil {
			sum := sha256.Sum256([]byte(t))
			return hex(sum[:])
		}
	case string:
		if err := json.Unmarshal([]byte(t), &val); err != nil {
			sum := sha256.Sum256([]byte(t))
			return hex(sum[:])
		}
	default:
		// 尝试把对象转为 JSON，再进流程
		b, err := json.Marshal(t)
		if err != nil {
			// 兜底：直接对 fmt 序列化的字节算 hash
			b2, _ := json.MarshalIndent(t, "", "")
			sum := sha256.Sum256(b2)
			return hex(sum[:])
		}
		if err := json.Unmarshal(b, &val); err != nil {
			sum := sha256.Sum256(b)
			return hex(sum[:])
		}
	}

	// 递归规范化
	val = canonicalize(val)

	// 稳定编码
	var buf bytes.Buffer
	encodeCanonical(&buf, val)

	sum := sha256.Sum256(buf.Bytes())
	return hex(sum[:])
}

func hex(b []byte) string {
	const hextable = "0123456789abcdef"
	out := make([]byte, len(b)*2)
	for i, v := range b {
		out[i*2] = hextable[v>>4]
		out[i*2+1] = hextable[v&0x0f]
	}
	return string(out)
}

func canonicalize(v any) any {
	switch x := v.(type) {
	case map[string]any:
		keys := make([]string, 0, len(x))
		for k := range x {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		out := make([][2]any, 0, len(keys)) // 保持顺序的 kv 列表
		for _, k := range keys {
			out = append(out, [2]any{k, canonicalize(x[k])})
		}
		return out // 我们的编码器会把它当作对象写出
	case []any:
		out := make([]any, len(x))
		for i := range x {
			out[i] = canonicalize(x[i])
		}
		return out
	case json.Number:
		// 规范数字表现：优先整数，否则 float
		if i, err := x.Int64(); err == nil {
			return i
		}
		if f, err := x.Float64(); err == nil {
			return f
		}
		return x.String()
	default:
		return x
	}
}

// encodeCanonical 将 canonicalize 处理后的值写为稳定 JSON：
// - map 用 [2]any 切片承载（key,value），我们按顺序写成 {"k":v,...}
// - 数字格式：整数用十进制，浮点用 'g'，去除多余小数
func encodeCanonical(buf *bytes.Buffer, v any) {
	switch x := v.(type) {
	case nil:
		buf.WriteString("null")
	case bool:
		if x {
			buf.WriteString("true")
		} else {
			buf.WriteString("false")
		}
	case string:
		// 用标准库转义 string
		b, _ := json.Marshal(x)
		buf.Write(b)
	case float64:
		// 统一浮点输出
		buf.WriteString(strconv.FormatFloat(x, 'g', -1, 64))
	case float32:
		buf.WriteString(strconv.FormatFloat(float64(x), 'g', -1, 32))
	case int, int8, int16, int32, int64:
		buf.WriteString(strconv.FormatInt(reflectToInt64(x), 10))
	case uint, uint8, uint16, uint32, uint64:
		buf.WriteString(strconv.FormatUint(reflectToUint64(x), 10))
	case [][2]any: // our ordered object
		buf.WriteByte('{')
		for i, kv := range x {
			if i > 0 {
				buf.WriteByte(',')
			}
			// key
			k, _ := kv[0].(string)
			b, _ := json.Marshal(k)
			buf.Write(b)
			buf.WriteByte(':')
			encodeCanonical(buf, kv[1])
		}
		buf.WriteByte('}')
	case []any:
		buf.WriteByte('[')
		for i := range x {
			if i > 0 {
				buf.WriteByte(',')
			}
			encodeCanonical(buf, x[i])
		}
		buf.WriteByte(']')
	default:
		// 兜底：再次用标准库
		b, _ := json.Marshal(x)
		buf.Write(b)
	}
}

func reflectToInt64(v any) int64 {
	switch n := v.(type) {
	case int:
		return int64(n)
	case int8:
		return int64(n)
	case int16:
		return int64(n)
	case int32:
		return int64(n)
	case int64:
		return n
	default:
		panic(errors.New("not an int"))
	}
}
func reflectToUint64(v any) uint64 {
	switch n := v.(type) {
	case uint:
		return uint64(n)
	case uint8:
		return uint64(n)
	case uint16:
		return uint64(n)
	case uint32:
		return uint64(n)
	case uint64:
		return n
	default:
		panic(errors.New("not a uint"))
	}
}
