import { CommentAttachment, MentionPayload } from "../main/type";

export type CommentInputProps = {
    className?: string;
    placeholder?: string;
    onSubmit?: (text: string, mentions: MentionPayload[], attachments: CommentAttachment[]) => Promise<void>;
}