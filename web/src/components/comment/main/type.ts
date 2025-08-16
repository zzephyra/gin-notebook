import { TaskCommentFilter, TaskCommentParams } from "@/features/api/type";
import { WorkspaceMember } from "@/types/workspace";

export type CommentAttachment = {
    id?: string;
    url: string;
    name: string;
    size: number;
    type: string; // MIME type
    status?: 'uploading' | 'uploaded' | 'error'; // Status of the attachment
    [key: string]: any; // Allow additional properties
}

export type Comment = {
    id: string;
    content: string;
    author: Partial<WorkspaceMember>;
    created_at: string;
    updated_at: string;
    attachments?: CommentAttachment[];
    mentions?: MentionPayload[];
    [key: string]: any; // Allow additional properties
}

export type CommentProps = {
    taskId: string;
    // comments: Comment[];
    filter?: TaskCommentParams;
    currentUser: WorkspaceMember;
    onCommentSubmit?: (comment: Comment) => void;
    onCommentUpdate?: (commentID: string, comment: Comment) => void;
    inputRender?: (props: { value: string; onChange: (value: string) => void }) => React.ReactNode;
    emptyRender?: React.ReactNode;
    onFilterChange?: (filter: Partial<TaskCommentFilter>) => void;
}

export type MentionPayload = {
    member_id: string;     // 被@的用户ID
    label: string;       // 展示名称快照
    member?: WorkspaceMember; // 被@的用户信息
    start_rune: number; // 在纯文本内的起始下标（包含@）
    end_rune: number;   // 结束下标（不含）
    [key: string]: any; // 允许额外属性
};