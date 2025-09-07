import { CommentAttachment, MentionPayload } from "../main/type";

export type CommentInputProps = {
    className?: string;
    placeholder?: string;
    onSubmit?: (text: string, mentions: MentionPayload[], attachments: CommentAttachment[]) => Promise<void>;
}

export type CommentInputRef = {
    focus: (moveToEnd?: boolean) => void;
    getValue: () => {
        content: string;
        mentions: any[];
        attachments: CommentAttachment[];
    };
    clear: () => void;
    openFileDialog: () => void;
    addFiles: (files: File[]) => void;
    cancelAllUploads: () => void;
    removeAttachment: (id: string | number) => void;
}