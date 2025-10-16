package tools

import (
	"crypto/sha1"
	"encoding/hex"
	"strconv"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	extast "github.com/yuin/goldmark/extension/ast"
	"github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/text"
)

type MDItem struct {
	NodeUID  string `json:"node_uid"`
	Type     string `json:"type"`
	Path     string `json:"path"`      // 例如 "0/2/1"
	TextHash string `json:"text_hash"` // 归一化文本的哈希
	Depth    int    `json:"depth"`     // 标题级别（非标题为0）
}

type MDIndex = map[string]MDItem

// BuildMdIndex 解析 Markdown，抽取“块级节点”并计算 node_uid。
func BuildMdIndex(md []byte) (MDIndex, error) {
	mdParser := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM, // table, strikethrough, taskList, etc.
		),
		goldmark.WithRendererOptions(
			html.WithUnsafe(),
		),
	)
	reader := text.NewReader(md)
	root := mdParser.Parser().Parse(reader)

	index := make(MDIndex)
	var path []int

	var visit func(n ast.Node, parent ast.Node)
	visit = func(n ast.Node, parent ast.Node) {
		// 进栈：计算 n 在 parent.children 的序号
		if parent != nil {
			i := 0
			for c := parent.FirstChild(); c != nil; c = c.NextSibling() {
				if c == n {
					break
				}
				i++
			}
			path = append(path, i)
		}

		// 需要的“块级”节点
		if isBlockish(n) {
			p := intsToPath(path)
			tt, depth := nodeType(n)
			norm := normalizeText(n, md)
			nodeUID := shortSHA1(p + "|" + tt + "|" + itoa(depth) + "|" + norm)
			index[nodeUID] = MDItem{
				NodeUID:  nodeUID,
				Type:     tt,
				Path:     p,
				TextHash: shortSHA1(norm),
				Depth:    depth,
			}
		}

		for c := n.FirstChild(); c != nil; c = c.NextSibling() {
			visit(c, n)
		}

		// 出栈
		if len(path) > 0 {
			path = path[:len(path)-1]
		}
	}

	visit(root, nil)
	return index, nil
}

func isBlockish(n ast.Node) bool {
	switch n.(type) {
	case *ast.Heading,
		*ast.Paragraph,
		*ast.List, *ast.ListItem,
		*ast.CodeBlock, *ast.FencedCodeBlock,
		*ast.Blockquote,
		*ast.ThematicBreak,
		*extast.Table, *extast.TableRow, *extast.TableCell:
		return true
	default:
		return false
	}
}

func nodeType(n ast.Node) (string, int) {
	switch x := n.(type) {
	case *ast.Heading:
		return "heading", x.Level
	case *ast.Paragraph:
		return "paragraph", 0
	case *ast.List:
		if x.IsOrdered() {
			return "listOrdered", 0
		}
		return "list", 0
	case *ast.ListItem:
		return "listItem", 0
	case *ast.CodeBlock, *ast.FencedCodeBlock:
		return "code", 0
	case *ast.Blockquote:
		return "blockquote", 0
	case *ast.ThematicBreak:
		return "thematicBreak", 0
	case *extast.Table:
		return "table", 0
	case *extast.TableRow:
		return "tableRow", 0
	case *extast.TableCell:
		return "tableCell", 0
	default:
		return "unknown", 0
	}
}

func normalizeText(n ast.Node, source []byte) string {
	var b strings.Builder
	// 收集当前块节点内的纯文本（含行内）
	ast.Walk(n, func(nn ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}
		switch t := nn.(type) {
		case *ast.Text:
			b.Write(t.Text(source))
		case *ast.CodeSpan:
			b.Write(t.Text(source))
		}
		return ast.WalkContinue, nil
	})
	// 空白归一化 + 截断避免极长
	s := strings.TrimSpace(strings.Join(strings.Fields(b.String()), " "))
	if len(s) > 400 {
		s = s[:400]
	}
	return s
}

func shortSHA1(s string) string {
	h := sha1.Sum([]byte(s))
	return hex.EncodeToString(h[:])[:12]
}
func intsToPath(a []int) string {
	if len(a) == 0 {
		return "0"
	}
	sb := strings.Builder{}
	for i, v := range a {
		if i > 0 {
			sb.WriteByte('/')
		}
		sb.WriteString(itoa(v))
	}
	return sb.String()
}
func itoa(i int) string {
	return strconv.Itoa(i)
}
