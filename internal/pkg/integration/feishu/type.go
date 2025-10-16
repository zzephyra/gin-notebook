package feishu

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
	TextRun *struct {
		Content          string `json:"content"`
		TextElementStyle struct {
			Bold          bool `json:"bold"`
			InlineCode    bool `json:"inline_code"`
			Italic        bool `json:"italic"`
			Strikethrough bool `json:"strikethrough"`
			Underline     bool `json:"underline"`
		} `json:"text_element_style"`
	} `json:"text_run"`
}

type FeishuBlock struct {
	BlockID   string   `json:"block_id"`
	BlockType int      `json:"block_type"`
	ParentID  string   `json:"parent_id"`
	Children  []string `json:"children"`

	// 常见容器：paragraph / heading1 / ordered / quote
	Text *struct {
		Elements []FeishuElement `json:"elements"`
		Style    any             `json:"style"`
	} `json:"text"`

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
