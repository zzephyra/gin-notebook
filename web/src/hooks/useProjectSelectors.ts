// useProjectSelectors.ts
import { useQuery } from "@tanstack/react-query";
import { findTask } from "@/utils/boardPatch";
import { ToDoColumn, TodoTask } from "@/components/todo/type";
import { ProjectBoardType } from "@/types/project";
import { getBoardQueryKey } from "./useTodoTask";
export function useProjectTask(projectId: string, params: any, taskId: string) {
    return useQuery<ProjectBoardType, unknown, TodoTask | undefined>({
        queryKey: getBoardQueryKey(projectId, params),
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
    taskId: string
) {
    return useQuery<ProjectBoardType, unknown, ToDoColumn | undefined>({
        queryKey: getBoardQueryKey(projectId, params),
        select: (data) => {
            const found = findTask(data?.todo ?? [], taskId);
            if (!found) return undefined;
            // 从当前 board 拿这条任务所在列
            return (data?.todo ?? []).find((c) => c.id === found.columnId);
        },
    });
}

export function useProjectColumns(projectId: string, params: any) {
    return useQuery<ProjectBoardType, unknown, ToDoColumn[]>({
        queryKey: getBoardQueryKey(projectId, params),
        select: (data) => data?.todo ?? [],
    });
}
