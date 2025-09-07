import { CSSProperties } from "react";
import { MentionPayload } from "../main/type";

export type CommentContentType = {
    content: string,
    mentions: MentionPayload[]
}

export interface CommentContentProps {
    defaultValue?: CommentContentType
    inputStyle?: CSSProperties
    editable?: boolean
    onBlur?: () => void,
    portalContainer?: HTMLElement | null;
    /** popover 容器；不传则用本地 container */
    popoverContainer?: HTMLElement | null;
    /** 供 calcInContainer 参考的滚动容器；不传则用本地 container */
    container?: React.RefObject<HTMLDivElement>;
}

export type CommentContentHandle = {
    getContent: () => CommentContentType;
    inputRef: React.RefObject<HTMLDivElement>;
    focus: (toEnd: boolean) => void;
    clear: () => void;
};