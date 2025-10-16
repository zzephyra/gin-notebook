package dto

import (
	"gin-notebook/pkg/utils/tools"

	"github.com/google/uuid"
)

func DefaultBlocks() Blocks {
	return Blocks{
		{
			ID:   uuid.NewString(),
			Type: "paragraph",
			Props: BlockPropsDTO{
				BackgroundColor: tools.Ptr("default"),
				TextColor:       tools.Ptr("default"),
				TextAlignment:   tools.Ptr("left"),
			},
			Content:  []InlineDTO{},
			Children: []NoteBlockDTO{},
		},
	}
}
