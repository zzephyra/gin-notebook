'use client';

import React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Plate, PlateCorePlugin, TPlateEditor } from '@udecode/plate/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { SettingsDialog } from '@/components/editor/settings';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';

export default function PlateEditor({ readOnly, value, onValueChange }: { readOnly?: boolean, value: string, onValueChange?: (value: string) => void }) {
    const editor = useCreateEditor({ readOnly });
    const isSyncingRef = useRef(false);

    /** 外部 value 改变时，把 Markdown 推进编辑器 */
    useEffect(() => {
        if (!editor) return;

        const currentMd = editor.api.markdown.serialize();
        if (currentMd === value) return;       // 已经一致，无需同步

        isSyncingRef.current = true;           // ① 打标记

        editor.tf.setValue(editor.api.markdown.deserialize(value));  // ② 覆盖内容
        editor.tf.focus({ edge: "endEditor" }); // 可选：把光标放到文档末尾

        // ③ Slate/Plate 的 onChange 会在下一拍执行；用微任务清除标记
        Promise.resolve().then(() => {
            isSyncingRef.current = false;
        });
    }, [value, editor]);

    /** 只在真正用户修改时才冒泡给父组件 */
    const handleValueChange = useCallback(
        ({ editor }: { editor: TPlateEditor }) => {
            if (isSyncingRef.current) return;    // 正在内部同步，跳过

            onValueChange?.(editor.api.markdown.serialize());
        },
        [onValueChange]
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <Plate readOnly={!readOnly} editor={editor} onValueChange={handleValueChange}>
                <EditorContainer>
                    <Editor variant="demo" />
                </EditorContainer>
                <SettingsDialog />
            </Plate>
        </DndProvider >
    );
}


