import { UserBrief } from "@/types/user";
import { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/dist/types/types";

export type TaksComment = {
    id: string;
    content: string;
    user: UserBrief;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;

}

export type Priority = 'high' | 'medium' | 'low';

export type TodoTask = {
    id: string;
    order?: string;
    title?: string;
    columnId: string;
    priority?: Priority;
    assignee?: UserBrief[];
    deadline?: string | null;
    description?: string;
    comments?: TaksComment[];
    user?: UserBrief;
    isEdit?: boolean;
    [key: string]: any;
}

export type TaskState =
    | {
        type: 'idle';
    }
    | {
        type: 'is-card-over';
    }
    | {
        type: 'is-dragging';
    }
    | {
        type: 'is-column-over';
        closestEdge: Edge | null;
    }
    | {
        type: 'is-dragging-over';
        closestEdge: Edge | null;
    };

export type TodoPriorityOption = {
    label: string;
    value: Priority;
}

export type ToDoColumn = {
    id: string;
    name: string;
    color: string;
    total: number;
    process_id: number;
    summary: Record<Priority, number>;
    tasks: TodoTask[];
    [key: string]: any;

};

export type Project = {
    id: string;
    name: string;
    description?: string;
    status?: string;
    [key: string]: any;

    // owner_id?: string;
}

export type ProjectBoard = ToDoColumn[];

export type TaksPayload = {
    title?: string;
    description?: string;
    priority?: Priority;
    assignee_actions?: Partial<AssigneeAction>;
    deadline?: string | null;
    [key: string]: any;
}

export type CreateTaskInput = {
    column_id: string;
    project_id: string;
    workspace_id: string;
    after_id?: string;
    before_id?: string;
    order_hint?: string;
    client_temp_id: string;
    payload: Partial<TaksPayload>;
};


export type CreateTaskResponse = {
    id: string;         // 服务端雪花 ID
    columnId: string;
    order: string;      // 服务端最终裁决的顺序
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    assignee?: Array<{ id: string; name?: string }>;
    deadline?: string | null;
};

export type UpdateTaskInput = {
    id: string;
    columnId: string;
    patch: Partial<Omit<TodoTask, 'id' | 'columnId' | 'order'>>;
};

export type MoveTaskInput = {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    afterId?: string;
    beforeId?: string;
    orderHint?: string;
};

export type AssigneeAction = {
    action_add?: string[];
    action_remove?: string[];
}

export type SubmitExtraParams = {
    assignee_actions?: Partial<AssigneeAction>;
    [key: string]: any;
}