import { createReactInlineContentSpec } from "@blocknote/react";

export const commentMark = createReactInlineContentSpec({
    type: "custom-comment",
    propSchema: {
        threadId: {
            default: ""
        },
    },
    content: "none",
},
    {
        render: (props) => (
            <>
                <span
                    className="bg-yellow-200 underline cursor-pointer"
                    data-thread-id={props.inlineContent.props.threadId}
                >
                    {props.inlineContent.content}
                </span>
            </>
        )
    }
)