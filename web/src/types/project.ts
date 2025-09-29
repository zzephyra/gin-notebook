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
    column_id?: string; // 列ID，多个用逗号分隔
    order_by?: string;
    asc?: boolean;
    f1?: string; // 用于分页，从指定任务开始加载
    fid?: string; // 用于分页，从指定任务ID开始加载
    b1?: string; // 用于分页，从指定任务结束加载
    bid?: string; // 用于分页，从指定任务ID结束加载
}
