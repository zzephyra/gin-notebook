'use client';

import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Plate } from '@udecode/plate/react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { SettingsDialog } from '@/components/editor/settings';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';

export default function PlateEditor({ readOnly, value, onValueChange }: { readOnly?: boolean, value: string, onValueChange?: (value: string) => void }) {
    const editor = useCreateEditor({
        content: value,
        readOnly: !readOnly
    });

    return (
        <DndProvider backend={HTML5Backend}>
            <Plate readOnly={!readOnly} editor={editor} onValueChange={({ editor }) => onValueChange && onValueChange(editor.api?.markdown.serialize())}>
                <EditorContainer>
                    <Editor variant="demo" />
                </EditorContainer>
                <SettingsDialog />
            </Plate>
        </DndProvider >
    );
}
