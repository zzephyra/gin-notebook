import { ToDoColumn } from "@/components/todo/type";

export interface ProjectType {
    id: string;
    icon?: string | null;
    name: string;
    description?: string;
    workspace_id: string;
    status: string; // active, archived
    created_at: string;
    updated_at: string;
    settings: {
        card_preview?: string; // null, cover
        is_public: boolean; // 是否公开，所有成员可见
        is_archived: boolean; // 是否归档，归档后不可操作
        enable_comments: boolean; // 是否启用评论
        updated_at: string;
    },
    // todo: ToDoColumn[];
    [key: string]: any;
}

export interface ProjectBoardType {
    todo: ToDoColumn[];
    [key: string]: any;
}

export type TodoParamsType = {
    order_by?: string;
    asc?: boolean;
}
