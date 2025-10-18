package feishu

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"strings"
)

// —— 可比对索引条目 ——
// 注：Type 统一成我们内部的命名，便于跨平台复用
type FeishuIdxItem struct {
	BlockID  string
	Type     string // paragraph | heading1 | ordered_item | quote | table | table_cell | unknown
	Path     string // 0/1/2
	TextHash string
	ParentID string
	OrderIdx int
}

type FeishuIndex = map[string]FeishuIdxItem // key: block_id

// BuildFeishuIndex 将飞书 Blocks JSON 转成可比对索引（含 path / text hash）
func BuildFeishuIndex(raw []byte) (FeishuIndex, error) {
	var resp FeishuBlockConvertResp
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}
	byID := make(map[string]FeishuBlock, len(resp.Data.Blocks))
	for _, b := range resp.Data.Blocks {
		byID[*b.BlockID] = b
	}

	idx := make(FeishuIndex, len(byID))

	var dfs func(id string, path []int, parent string)
	dfs = func(id string, path []int, parent string) {
		b, ok := byID[id]
		if !ok {
			return
		}
		item := FeishuIdxItem{
			BlockID:  *b.BlockID,
			Type:     detectFsType(b),
			Path:     intsToPath(path),
			TextHash: shortSHA1(normalizeFsText(b)),
			ParentID: parent,
			OrderIdx: 0,
		}
		if len(path) > 0 {
			item.OrderIdx = path[len(path)-1]
		}
		idx[*b.BlockID] = item

		for i, cid := range b.Children {
			dfs(cid, append(path, i), *b.BlockID)
		}
	}

	for i, id := range resp.Data.FirstLevelBlockIDs {
		dfs(id, []int{i}, "")
	}
	return idx, nil
}

func detectFsType(b FeishuBlock) string {
	switch b.BlockType {
	case 2:
		return "paragraph"
	case 3:
		return "heading1" // 如需区分 heading2/3…，可用额外字段或 ExtMeta
	case 13:
		return "ordered_item"
	case 15:
		return "quote"
	case 31:
		return "table"
	case 32:
		return "table_cell"
	default:
		return "unknown"
	}
}

func normalizeFsText(b FeishuBlock) string {
	pick := func(el []FeishuElement) string {
		ss := make([]string, 0, len(el))
		for _, e := range el {
			if e.TextRun != nil {
				ss = append(ss, e.TextRun.Content)
			}
		}
		s := strings.Join(ss, " ")
		s = strings.Join(strings.Fields(s), " ")
		s = strings.TrimSpace(s)
		if len(s) > 400 {
			s = s[:400]
		}
		return s
	}
	switch b.BlockType {
	case 2:
		if b.Text != nil {
			return pick(b.Text.Elements)
		}
	case 3:
		if b.Heading1 != nil {
			return pick(b.Heading1.Elements)
		}
	case 13:
		if b.Ordered != nil {
			return pick(b.Ordered.Elements)
		}
	case 15:
		if b.Quote != nil {
			return pick(b.Quote.Elements)
		}
	}
	// 表格/单元格等：文本一般在子段落，当前返回空
	return ""
}

func shortSHA1(s string) string { h := sha1.Sum([]byte(s)); return hex.EncodeToString(h[:])[:12] }

func intsToPath(a []int) string {
	if len(a) == 0 {
		return "0"
	}
	var b strings.Builder
	for i, v := range a {
		if i > 0 {
			b.WriteByte('/')
		}
		b.WriteString(itoa(v))
	}
	return b.String()
}

func itoa(i int) string {
	const digits = "0123456789"
	if i == 0 {
		return "0"
	}
	neg := i < 0
	if neg {
		i = -i
	}
	var b [20]byte
	pos := len(b)
	for i > 0 {
		pos--
		b[pos] = digits[i%10]
		i /= 10
	}
	if neg {
		pos--
		b[pos] = '-'
	}
	return string(b[pos:])
}
