import { createContext, useContext } from 'react';
import type { ProjectBoard, Project, SubmitExtraParams, TaksPayload, UpdateOptions, TodoTask } from '@/components/todo/type';
import type { ActiveDraft, StartDraftOptions } from "@/hooks/useTodoTask"
import { UserPresence } from '@/lib/realtime';
import { ProjectBoardType, ProjectType, TodoParamsType } from '@/types/project';
import { ProjectSettingsPayload } from '@/features/api/type';
export type TodoContextValue = {
    columns: ProjectBoard;
    projectList: Project[];
    currentProject?: ProjectType | null;
    isLoadTodo: boolean;
    isLoading: boolean;
    updateProjectSetting: (payload: ProjectSettingsPayload) => Promise<void>;
    updateProject: (payload: Partial<ProjectType>) => Promise<void>;
    setTodoParams: (params: TodoParamsType) => void;
    todoParams: TodoParamsType;
    activeOverlay?: boolean;
    activeDraft?: ActiveDraft;
    clearDraft: () => void;
    loadMoreTasks: (columnID: string) => Promise<{ code: number; data: ProjectBoardType; }>;
    updateDraftTask: (patch: Partial<TodoTask>) => void;
    setActiveOverlay?: (open: boolean) => void;
    // 你在 useProjectTodo 暴露的能力（按你的实现填充）
    startDraftTask: (columnId: string, opts: StartDraftOptions) => Promise<string>;
    updateTask: (tempId: string, patch: Partial<TaksPayload>, opts?: UpdateOptions) => void;
    submitTask: (task: TodoTask, columnId: string, params?: SubmitExtraParams) => Promise<any>;
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
