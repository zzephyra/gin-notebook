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
    column_id?: string;
    priority?: Priority;
    assignee?: UserBrief[];
    deadline?: string | null;
    description?: string;
    comments?: TaksComment[];
    user?: UserBrief;
    isEdit?: boolean;
    updated_at?: string;
    isDraft?: boolean; // 是否为草稿（刚创建，尚未保存到服务端）
    cover?: string | null;
    [key: string]: any;
}

export type ColumnState =
    | {
        type: 'is-card-over';
        isOverChildCard: boolean;
        dragging: DOMRect;
    }
    | {
        type: 'is-column-over';
        closestEdge: Edge | null;
    }
    | {
        type: 'idle';
    }
    | {
        type: 'is-dragging';
    };

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
        type: 'is-dragging-over';
        closestEdge: Edge | null;
    } | {
        type: 'is-dragging-and-left-self';
    }
    | {
        type: 'is-over';
        dragging: DOMRect;
        closestEdge: Edge;
    }
    | {
        type: 'preview';
        container: HTMLElement;
        dragging: DOMRect;
    } | {
        type: "is-card-header";
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
    icon?: string | null;
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
    cover?: string | null;
    [key: string]: any;
}

export type UpdateOptions = {
    onlyUpdateLocal?: boolean; // 仅更新本地状态，不调用接口
    insertIndex?: number; // 插入到指定位置
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

export type TaskUpdatePayload = {
    title?: string;
    description?: string;
    priority?: Priority;
    assignee?: UserBrief[];
    before_id?: string | null;
    after_id?: string | null;
    deadline?: string | null;
};

export type ColumnUpdatePayload = {
    name?: string;
    description?: string;
    order?: string;
    process_id?: number;
    before_id?: string | null;
    after_id?: string | null;
}

export type AssigneeAction = {
    action_add?: string[];
    action_remove?: string[];
}

export type SubmitExtraParams = {
    assignee_actions?: Partial<AssigneeAction>;
    [key: string]: any;
}


export const cardKey = Symbol('card');

export type TCardData = {
    [cardKey]: true;
    task: TodoTask;
    columnId: string;
    rect: DOMRect;
};

export const cardDropTargetKey = Symbol('card-drop-target');
export type TCardDropTargetData = {
    [cardDropTargetKey]: true;
    task: TodoTask;
    columnId: string;
};

export const columnKey = Symbol('column');
export type TColumnData = {
    [columnKey]: true;
    column: ToDoColumn;
};


export const TagAttributesMap: Record<Priority, any> = {
    high: { type: "light", size: "small", color: "red" },
    medium: { type: "light", size: "small", color: "amber" },
    low: { type: "light", size: "small", color: "lime" },
};

export const PriorityColorMap: Record<Priority, string> = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500",
};