import { BlockNoteEditor } from "@blocknote/core";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import { useLingui } from "@lingui/react/macro";
import { v4 as uuidv4 } from 'uuid';


function createComment(editor: BlockNoteEditor, schema: any) {
    const { state, dispatch } = editor.prosemirrorView!;   // 断言存在
    const { from, to, empty } = state.selection;           // ✅有 from/to
    if (empty) return;
    console.log("create comment", schema.marks.comment);
    // 添加 comment
    const id = uuidv4();
    dispatch(
        state.tr
            .addMark(from, to, schema.marks.comment.create({ id }))     // 给文字套 mark
            .setMeta("addComment", { from, to, id })                    // 让插件加 Decoration
    );

}

const CommentInput = ({ editor, schema }: { editor: BlockNoteEditor, schema: any }) => {
    const { t } = useLingui();

    return (
        <>
            <div className="flex flex-col gap-2 py-2 rounded">
                <Textarea className="min-w-80" classNames={{ inputWrapper: "shadow-none border-0" }}>

                </Textarea>
                <div className="flex justify-end ">
                    <Button className="min-w-0 h-7 w-12" onPress={() => createComment(editor, schema)}>{t`Save`}</Button>
                </div>
            </div>
        </>
    )
}

export default CommentInput;