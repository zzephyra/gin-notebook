package feishu

import (
	"gin-notebook/pkg/utils/tools"
	"sort"
)

type mdEntry struct {
	NodeUID  string
	Type     string
	Path     string
	TextHash string
	Depth    int
	Parent   string
}
type fsEntry struct {
	BlockID  string
	Type     string
	Path     string
	TextHash string
	ParentID string
	OrderIdx int
}

func MdIndexToSeq(mdIdx tools.MDIndex) []mdEntry {
	out := make([]mdEntry, 0, len(mdIdx))
	for _, v := range mdIdx {
		out = append(out, mdEntry{
			NodeUID:  v.NodeUID,
			Type:     v.Type,
			Path:     v.Path,
			TextHash: v.TextHash,
			Depth:    v.Depth,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path < out[j].Path })
	return out
}

func FeishuIndexToSeq(fsIdx FeishuIndex) []fsEntry {
	out := make([]fsEntry, 0, len(fsIdx))
	for _, v := range fsIdx {
		switch v.Type {
		case "paragraph", "heading1", "ordered_item", "quote":
			out = append(out, fsEntry{
				BlockID:  v.BlockID,
				Type:     v.Type,
				Path:     v.Path,
				TextHash: v.TextHash,
				ParentID: v.ParentID,
				OrderIdx: v.OrderIdx,
			})
		default:
			// 跳过结构节点：table / table_cell / unknown
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path < out[j].Path })
	return out
}

type Pair struct {
	NodeUID string
	BlockID string
}

func MatchMdToFeishu(mdSeq []mdEntry, fsSeq []fsEntry, fuzzyThreshold float64) (pairs []Pair, mdUnmatched []mdEntry, fsUnmatched []fsEntry) {
	usedFs := make(map[string]bool)
	hasPair := make(map[string]bool)

	for _, m := range mdSeq {
		fsType := mapMdTypeToFsType(m)
		for i := range fsSeq {
			f := &fsSeq[i]
			if usedFs[f.BlockID] || f.Type != fsType {
				continue
			}
			if f.TextHash != "" && f.TextHash == m.TextHash {
				pairs = append(pairs, Pair{NodeUID: m.NodeUID, BlockID: f.BlockID})
				usedFs[f.BlockID] = true
				hasPair[m.NodeUID] = true
				break
			}
		}
	}

	for _, m := range mdSeq {
		if hasPair[m.NodeUID] {
			continue
		}
		fsType := mapMdTypeToFsType(m)
		bestIdx, bestScore := -1, 0.0
		for i := range fsSeq {
			f := &fsSeq[i]
			if usedFs[f.BlockID] || f.Type != fsType {
				continue
			}
			score := cheapSimilarity(m.TextHash, f.TextHash)
			if score > bestScore {
				bestScore, bestIdx = score, i
			}
		}
		if bestIdx >= 0 && bestScore >= fuzzyThreshold {
			f := fsSeq[bestIdx]
			pairs = append(pairs, Pair{NodeUID: m.NodeUID, BlockID: f.BlockID})
			usedFs[f.BlockID] = true
			hasPair[m.NodeUID] = true
		}
	}

	for _, m := range mdSeq {
		if !hasPair[m.NodeUID] {
			mdUnmatched = append(mdUnmatched, m)
		}
	}
	for _, f := range fsSeq {
		if !usedFs[f.BlockID] {
			fsUnmatched = append(fsUnmatched, f)
		}
	}
	return
}

func mapMdTypeToFsType(m mdEntry) string {
	switch m.Type {
	case "heading":
		// 可按 m.Depth 细化到 heading2/3…
		return "heading1"
	case "listItem":
		return "ordered_item" // 如需无序项，自行扩展
	case "blockquote":
		return "quote"
	case "paragraph", "code":
		return "paragraph"
	default:
		return "paragraph"
	}
}

func cheapSimilarity(a, b string) float64 {
	if a == b {
		return 1.0
	}
	if a == "" || b == "" {
		return 0.0
	}
	// 共有前缀 / maxLen（快速近似；如需更准替换成 Jaro/Levenshtein）
	n := min(len(a), len(b))
	p := 0
	for p < n && a[p] == b[p] {
		p++
	}
	maxLen := len(a)
	if len(b) > maxLen {
		maxLen = len(b)
	}
	return float64(p) / float64(maxLen)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
