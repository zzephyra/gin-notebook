import { UserPresence } from "@/lib/realtime";
import { createContext, useContext } from "react";

export type WorkspaceContextValue = {
    onlineMap?: Record<string, UserPresence[]>;
    getTaskViewers: (taskId: string) => UserPresence[];
    blurTask?: (projectId: string, taskId: string) => void;
    focusTask?: (projectId: string, taskId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) throw new Error('useTodo must be used within <TodoProvider/>');
    return ctx;
}

export default WorkspaceContext;