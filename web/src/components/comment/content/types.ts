import { CSSProperties } from "react";
import { MentionPayload } from "../main/type";

export type CommentContentType = {
    content: string,
    mentions: MentionPayload[]
}

export interface CommentContentProps {
    container: React.RefObject<HTMLDivElement>
    defaultValue?: CommentContentType
    inputStyle?: CSSProperties
}

export type CommentContentHandle = {
    getContent: () => CommentContentType;
};