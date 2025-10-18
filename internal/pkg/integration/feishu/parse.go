package feishu

import (
	"gin-notebook/internal/pkg/dto"

	larkdocx "github.com/larksuite/oapi-sdk-go/v3/service/docx/v1"
)

func GetBlockType(block dto.NoteBlockDTO) int {
	switch block.Type {
	case "paragraph":
		return 2
	case "heading":
		level := 0
		if block.Props.Level != nil {
			level = *block.Props.Level
		}
		return 2 + level
	case "bulletListItem":
		return 12
	case "numberedListItem":
		return 13
	case "codeBlock":
		return 14
	case "quote":
		return 15
	}
	return 9999
}

func GetBlockColor(color string) int {
	switch color {
	case "pink":
		return 1
	case "orange":
		return 2
	case "yellow":
		return 3
	case "green":
		return 4
	case "blue":
		return 5
	case "purple":
		return 6
	case "gray":
		return 7
	}
	return 0
}

func GetBlockBgColor(color string) string {
	switch color {
	case "pink":
		return "LightGrayBackground"
	case "orange":
		return "LightOrangeBackground"
	case "yellow":
		return "LightYellowBackground"
	case "green":
		return "LightGreenBackground"
	case "blue":
		return "LightBlueBackground"
	case "purple":
		return "LightPurpleBackground"
	case "gray":
		return "PaleGrayBackground"
	case "red":
		return "DarkRedBackground"
	}
	return ""
}

func GetTextAlignment(alignment string) int {
	switch alignment {
	case "left":
		return 1
	case "center":
		return 2
	case "right":
		return 3
	}
	return 1
}

func ParseBlockToLark(blocks dto.Blocks) []*larkdocx.Block {
	var feishuBlocks []*larkdocx.Block

	for _, block := range blocks {
		contents := block.Content

		blockType := GetBlockType(block)

		elements := []*larkdocx.TextElement{}
		for _, content := range contents {
			textColor := 0
			if content.Styles.TextColor != nil {
				textColor = GetBlockColor(*content.Styles.TextColor)
			}

			textElementStyle := larkdocx.NewTextElementStyleBuilder().
				Bold(content.Styles.Bold != nil && *content.Styles.Bold).
				Italic(content.Styles.Italic != nil && *content.Styles.Italic).
				Underline(content.Styles.Underline != nil && *content.Styles.Underline).
				Strikethrough(content.Styles.Strike != nil && *content.Styles.Strike).
				InlineCode(content.Styles.Code != nil && *content.Styles.Code)

			if textColor != 0 {
				textElementStyle.TextColor(textColor)
			}

			element := larkdocx.NewTextElementBuilder().
				TextRun(larkdocx.NewTextRunBuilder().
					Content(content.Text).
					TextElementStyle(textElementStyle.
						Build()).
					Build()).
				Build()
			elements = append(elements, element)
		}

		if len(elements) == 0 {
			elements = append(elements, larkdocx.NewTextElementBuilder().
				TextRun(larkdocx.NewTextRunBuilder().
					Content("").
					Build()).
				Build())
		}

		var style = larkdocx.NewTextStyleBuilder().
			Align(GetTextAlignment(*block.Props.TextAlignment))

		if block.Props.BackgroundColor != nil {
			var bgColor = GetBlockBgColor(*block.Props.BackgroundColor)
			if bgColor != "" {
				style = style.BackgroundColor(bgColor)

			}
		}
		larkBlock := larkdocx.NewBlockBuilder().BlockType(blockType).Text(
			larkdocx.NewTextBuilder().
				Style(style.Build()).
				Elements(elements).Build(),
		).Build()
		feishuBlocks = append(feishuBlocks, larkBlock)
	}

	return feishuBlocks
}
