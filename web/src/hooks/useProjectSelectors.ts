// useProjectSelectors.ts
import { useQuery } from "@tanstack/react-query";
import { findTask } from "@/utils/boardPatch";

import { projectBoardQueryOptions } from "./useTodoTask";
export function useProjectTask(projectId: string, params: any, taskId: string, workspaceId: string) {
    return useQuery({
        ...projectBoardQueryOptions(projectId, workspaceId, params),
        // 只挑出这一条 task。React Query 会把 select 结果做引用比较，没变就不触发渲染
        select: (data) => {
            const found = findTask(data?.todo ?? [], taskId);
            return found?.task;
        },
    });
}

export function useProjectTaskColumn(
    projectId: string,
    params: any,
    taskId: string,
    workspaceId: string
) {
    return useQuery({
        ...projectBoardQueryOptions(projectId, workspaceId, params),
        select: (data) => {
            const found = findTask(data?.todo ?? [], taskId);
            if (!found) return undefined;
            // 从当前 board 拿这条任务所在列
            return (data?.todo ?? []).find((c) => c.id === found.columnId);
        },
    });
}

export function useProjectColumns(projectId: string, params: any, workspaceId: string) {
    return useQuery({
        ...projectBoardQueryOptions(projectId, workspaceId, params),
        select: (data) => data?.todo ?? [],
    });
}
