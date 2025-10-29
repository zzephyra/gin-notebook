package feishu

import larkdocx "github.com/larksuite/oapi-sdk-go/v3/service/docx/v1"

type RefreshUserAccessTokenResponse struct {
	AccessToken      string `json:"access_token"`
	RefreshToken     string `json:"refresh_token"`
	TokenType        string `json:"token_type"`
	ExpiresIn        int    `json:"expires_in"`
	RefreshExpiresIn int    `json:"refresh_expires_in"`
	Scope            string `json:"scope"`
}

type FeishuBlockConvertResp struct {
	Code int `json:"code"`
	Data struct {
		Blocks             []FeishuBlock `json:"blocks"`
		FirstLevelBlockIDs []string      `json:"first_level_block_ids"`
		BlockIDToImageURLs []any         `json:"block_id_to_image_urls"`
	} `json:"data"`
}

type FeishuElement struct {
	TextRun *FeishuElementTextRun `json:"text_run"`
}

type FeishuElementTextRun struct {
	Content          string                        `json:"content"`
	TextElementStyle FeishuTextElementTextRunStyle `json:"text_element_style"`
}

type FeishuTextElementTextRunStyle struct {
	Bold            bool `json:"bold"`
	InlineCode      bool `json:"inline_code"`
	Italic          bool `json:"italic"`
	Strikethrough   bool `json:"strikethrough"`
	Underline       bool `json:"underline"`
	TextColor       int  `json:"text_color"`
	BackgroundColor int  `json:"background_color"`
}

type FeishuTextElementStyle struct {
	Align            int    `json:"align"`
	Done             bool   `json:"done"`
	Folded           bool   `json:"folded"`
	Language         int    `json:"language"`
	Wrap             bool   `json:"wrap"`
	BackgroundColor  string `json:"background_color"`
	IndentationLevel int    `json:"indentation_level"`
	Sequence         string `json:"sequence"`
}
type FeishuGetBlocksResp struct {
	Code int `json:"code"`
	Data struct {
		HasMore bool          `json:"has_more"`
		Items   []FeishuBlock `json:"items"`
	} `json:"data"`
	Msg string `json:"msg"`
}

type FeishuBlockText struct {
	Elements []FeishuElement        `json:"elements"`
	Style    FeishuTextElementStyle `json:"style"`
}

type FeishuChildrenBlock struct {
	BlockID   string           `json:"block_id"`
	BlockType int              `json:"block_type"`
	ParentID  *string          `json:"parent_id"`
	Text      *FeishuBlockText `json:"text"`
}

type UpdateFeishuBlock struct {
	LocalBlockID  string          `json:"block_id"`
	Block         *larkdocx.Block `json:"block"`
	TargetBlockID string          `json:"target_block_id"`
}

type CreateFeishuBlock struct {
	LocalBlockIDs []string          `json:"local_block_id"`
	Index         int               `json:"index"`
	Block         []*larkdocx.Block `json:"block"`
	TargetBlockID string            `json:"target_block_id"`
	AfterID       *string           `json:"after_id"`
	BeforeID      *string           `json:"before_id"`
}

type FeishuBlock struct {
	BlockID   *string  `json:"block_id"`
	BlockType int      `json:"block_type"`
	ParentID  *string  `json:"parent_id"`
	Children  []string `json:"children"`

	Page *struct {
		Elements []FeishuElement `json:"elements"`
		Style    any             `json:"style"`
	}
	// 常见容器：paragraph / heading1 / ordered / quote
	Text *FeishuBlockText `json:"text"`

	Heading1 *struct {
		Elements []FeishuElement `json:"elements"`
		Style    any             `json:"style"`
	} `json:"heading1"`

	Ordered *struct {
		Elements []FeishuElement `json:"elements"`
		Style    struct {
			Sequence string `json:"sequence"`
		} `json:"style"`
	} `json:"ordered"`

	Quote *struct {
		Elements []FeishuElement `json:"elements"`
		Style    any             `json:"style"`
	} `json:"quote"`

	// 表格与单元格
	Table *struct {
		Property any      `json:"property"`
		Cells    []string `json:"cells"`
	} `json:"table"`

	TableCell *struct{} `json:"table_cell"`
}
