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

func UpdateBlock(blocks Blocks, actions []PatchOp) Blocks {
	for _, action := range actions {
		switch action.Op {
		case "insert":
			if action.Block == nil {
				continue
			}

			if action.AfterID == nil {
				blocks = append([]NoteBlockDTO{*action.Block}, blocks...)
			} else if action.BeforeID == nil {
				blocks = append(blocks, *action.Block)
			} else {
				index := -1
				for i, block := range blocks {
					if block.ID == *action.AfterID {
						index = i
						break
					}
				}

				if index != -1 {
					blocks = append(blocks[:index+1], append([]NoteBlockDTO{*action.Block}, blocks[index+1:]...)...)
				} else {
					blocks = append(blocks, *action.Block)
				}
			}

		case "update":
			for i, block := range blocks {
				if block.ID == action.NodeUID && action.Block != nil {
					blocks[i] = *action.Block
				}
			}
		case "move":
			// 1. 先找到要移动的节点，并将其从原位置删除
			var movingBlock *NoteBlockDTO
			var movingIndex int
			for i, block := range blocks {
				if block.ID == action.NodeUID {
					movingBlock = &block
					movingIndex = i
					break
				}
			}

			if movingBlock == nil {
				// 没找到要移动的节点，跳过
				continue
			}

			// 从原位置删除
			blocks = append(blocks[:movingIndex], blocks[movingIndex+1:]...)

			// 2. 根据 afterId 和 beforeId 插入到新位置
			if action.AfterID == nil {
				// 插入到开头
				blocks = append([]NoteBlockDTO{*movingBlock}, blocks...)
			} else if action.BeforeID == nil {
				// 插入到结尾
				blocks = append(blocks, *movingBlock)
			} else {
				// 插入到中间
				index := -1
				for i, block := range blocks {
					if block.ID == *action.AfterID {
						index = i
						break
					}
				}

				if index != -1 {
					blocks = append(blocks[:index+1], append([]NoteBlockDTO{*movingBlock}, blocks[index+1:]...)...)
				} else {
					// afterId 没找到，插到末尾
					blocks = append(blocks, *movingBlock)
				}
			}
		case "delete":
			for i, block := range blocks {
				if block.ID == action.NodeUID {
					blocks = append(blocks[:i], blocks[i+1:]...)
					break
				}
			}
		default:
			// return errors.New("unknown action op: " + action.Op)
		}
	}
	return blocks
}
