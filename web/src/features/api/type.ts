import { CommentAttachment, MentionPayload } from "@/components/comment/main/type";

export interface ApiResponse<T = any> {
    code: number;
    data?: T;
    error?: string;
}

export interface ListBaseParams {
    limit: number;
    offset: number;
    order_by?: string;
    order?: "asc" | "desc" | undefined;
    kw?: string;
}

export type WorkspaceDataType = {
    name: string;
    description: string;
    owner: number;
    created_at: string;
    id: number;
    owner_name: string;
    owner_avatar: string;
    owner_email: string;
    allow_invite: boolean;
    allow_join: boolean;
    allow_public: boolean;
    allow_share: boolean;
    allow_comment: boolean;
    role: string[];
}

export type WorkspaceNoteCreateParams = {
    title: string,
    workspace_id: string,
    category_id: string,
    tags_id?: string,
    status?: string,
    content?: string,
    allow_edit?: boolean,
    allow_invite?: boolean;
    allow_join?: boolean;
    allow_public?: boolean;
    allow_share?: boolean;
    allow_comment?: boolean;
}

export interface WorkspaceInviteLinkResponse {
    id: string,
    uuid: string,
    workspace_id: string,
    workspace_name: string,
    workspace_description: string | null,
    workspace_avatar: string,
    expire_at: string | null,
    allow_join: boolean
}

export interface FavoriteNoteListParams {
    workspace_id?: string;
    limit: number;
    offset: number;
    order_by?: string;
    order?: "asc" | "desc" | undefined;
    category_id?: string;
    kw?: string;
}

export interface FavoriteNote {
    owner_id: string;
    owner_email: string;
    owner_nickname: string;
    owner_avatar: string;
    note_id: string;
    note_title: string;
    note_content: string;
    note_category: string;
    note_category_id: string;
    note_tag: string;
    note_tag_id: string;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

export interface AISession {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
    // messages?: Message[];
}

export interface UpdateSession {
    title?: string;
}

export interface AIMessage {
    id: string;
    content: string;
    role: "user" | "assistant" | "system";
    status: "incomplete" | "complete" | "error" | "loading";
    session_id?: string;
    created_at: string
    references?: [];
    [x: string]: any;
}

export interface TaskCommentEditableData {
    content: string;
    mentions?: MentionPayload[];
}

export interface TaskCommentData extends TaskCommentEditableData {
    id?: string;
    member_id: string;
    task_id: string | number;
    attachments?: CommentAttachment[];
    [x: string]: any;
}


export interface TaskCommentFilter {
    mention_me?: boolean; // 是否只查询提及我的评论
    has_attachment?: boolean; // 是否只查询有附件的评论
    order_by?: string;
    order?: "asc" | "desc" | undefined;
}

export interface TaskCommentParams extends ListBaseParams, TaskCommentFilter {
    task_id: string;
    workspace_id: string;
    member_id: string;
    // project_id: string;
    [key: string]: any;
}

export interface TaskActivityOptions {
    Start: string; // 开始时间，ISO 8601 格式
    End: string;   // 结束时间，ISO 8601 格式
}