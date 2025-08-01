// src/contexts/TodoContext.tsx
import { createContext, useContext } from 'react';
import type { ProjectBoard, Project, TodoTask } from '@/components/todo/type';
import type { StartDraftOptions } from "@/hooks/useTodoTask"
export type TodoContextValue = {
    columns: ProjectBoard;
    projectList: Project[];
    currentProject?: Project;
    isLoading: boolean;

    // 你在 useProjectTodo 暴露的能力（按你的实现填充）
    startDraftTask: (columnId: string, opts: StartDraftOptions) => Promise<string>;
    updateDraftTask: (tempId: string, patch: Partial<TodoTask>) => void;
    submitDraftTask: (tempId: string) => Promise<any>;
    cancelDraftTask?: (tempId: string) => void;

    // 如果有移动/编辑等，也加上：
    // moveTask: (...) => Promise<void>;
    // updateTask: (...) => Promise<void>;
};

const TodoContext = createContext<TodoContextValue | null>(null);

export function useTodo() {
    const ctx = useContext(TodoContext);
    if (!ctx) throw new Error('useTodo must be used within <TodoProvider/>');
    return ctx;
}

export default TodoContext;
