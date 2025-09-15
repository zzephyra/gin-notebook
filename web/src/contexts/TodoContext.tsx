import { createContext, useContext } from 'react';
import type { ProjectBoard, Project, SubmitExtraParams, TaksPayload, UpdateOptions } from '@/components/todo/type';
import type { StartDraftOptions } from "@/hooks/useTodoTask"
import { UserPresence } from '@/lib/realtime';
export type TodoContextValue = {
    columns: ProjectBoard;
    projectList: Project[];
    currentProject?: Project;
    isLoading: boolean;
    activeOverlay?: boolean;
    setActiveOverlay?: (open: boolean) => void;
    // 你在 useProjectTodo 暴露的能力（按你的实现填充）
    startDraftTask: (columnId: string, opts: StartDraftOptions) => Promise<string>;
    updateTask: (tempId: string, patch: Partial<TaksPayload>, opts?: UpdateOptions) => void;
    submitTask: (tempId: string, params?: SubmitExtraParams) => Promise<any>;
    cancelDraftTask?: (tempId: string) => void;
    cleanColumnTasks: (columnId: string) => void;
    deleteTask: (taskId: string, columnId: string) => Promise<void>;
    updateColumn: (columnId: string, patch: Partial<{ name: string; color: string; }>) => Promise<void>;
    // 如果有移动/编辑等，也加上：
    // moveTask: (...) => Promise<void>;
    // updateTask: (...) => Promise<void>;
    onlineMap?: Record<string, UserPresence[]>;
    blurTask?: (taskId: string) => void;
    focusTask?: (taskId: string) => void;
};

const TodoContext = createContext<TodoContextValue | null>(null);

export function useTodo() {
    const ctx = useContext(TodoContext);
    if (!ctx) throw new Error('useTodo must be used within <TodoProvider/>');
    return ctx;
}

export default TodoContext;
