import { CreateTaskInput, Project, ProjectBoard, SubmitExtraParams, TodoTask } from '@/components/todo/type'
import { createTaskRequest, getProjectsListRequest, getProjectsRequest } from '@/features/api/project'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LexoRank } from "lexorank";
import { addTaskToColumnEnd, findTask, removeTaskById, replaceTaskById } from '@/utils/boardPatch'

const genTempId = () => (globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`);
export type ActiveDraftPtr = { id: string; columnId: string; colIdx: number } | null;
export type StartDraftOptions = {
    single?: 'submit' | 'cancel' | 'block'; // 默认 block
};


export function useProjectTodo(projectId: string, workspaceId: string) {
    const queryClient = useQueryClient();
    const [activeOverlay, setActiveOverlay] = useState(false);

    // 1) 项目列表
    const {
        data: projectList,
        isLoading: isLoadingProjects,
    } = useQuery({
        queryKey: ['project-list'],
        queryFn: async () => {
            let res = await getProjectsListRequest(workspaceId)
            return res.data.projects || []
        },
        staleTime: 5 * 60 * 1000,
    });
    // 2) 当前项目
    const currentProject = useMemo(() => {
        if (!projectList || projectList.length === 0) return undefined;
        const found = (projectList as Project[]).find((p) => p.id === projectId);
        return found || projectList[0];
    }, [projectList, projectId]);


    // 3) Board（真源）
    const {
        data: board,
        isLoading: isLoadingBoard,
        ...rest
    } = useQuery({
        queryKey: ['project-board', currentProject?.id],
        queryFn: async () => {
            if (!currentProject) return [];
            let res = await getProjectsRequest(currentProject.id, currentProject.workspace_id);
            return res.data.todo || [];
        },
        enabled: !!currentProject && !!projectList,
        staleTime: 5 * 60 * 1000,
    });


    // 4) 列快速索引：columnId -> colIdx（board 变一次，建一次）

    const columnIndex = useMemo(() => {
        const m = new Map<string, number>();
        (board || []).forEach((c, i) => m.set(c.id, i));
        return m;
    }, [board]);

    // 5) 活跃草稿指针 + 活跃列任务索引（taskId -> index）
    const [activeDraft, setActiveDraft] = useState<ActiveDraftPtr>(null);
    const activeDraftRef = useRef<ActiveDraftPtr>(null);
    useEffect(() => {
        activeDraftRef.current = activeDraft;
    }, [activeDraft]);

    // 仅为“活跃列”建立一个任务索引，代价极低
    const activeColumnTaskIndexRef = useRef<Map<string, number> | null>(null);
    useEffect(() => {
        if (!board) return;
        const ad = activeDraftRef.current;
        if (!ad) {
            activeColumnTaskIndexRef.current = null;
            return;
        }
        const col = board[ad.colIdx];
        if (!col || col.id !== ad.columnId) {
            activeColumnTaskIndexRef.current = null;
            return;
        }
        const m = new Map<string, number>();
        col.tasks.forEach((t, i) => m.set(t.id, i));
        activeColumnTaskIndexRef.current = m;
    }, [board, activeDraftRef.current?.id]); // board 动了，或活跃草稿切换，重建索引

    // 6) 快速读取当前草稿（接近 O(1)）
    function getActiveDraftFast(): { id: string; columnId: string; task: TodoTask } | null {
        const ad = activeDraftRef.current;
        if (!ad || !board) return null;

        // 6.1 直接按 colIdx 取列
        let col = board[ad.colIdx];
        if (col && col.id === ad.columnId) {
            const idx = activeColumnTaskIndexRef.current?.get(ad.id);
            if (idx != null) {
                const task = col.tasks[idx];
                if (task) return { id: ad.id, columnId: ad.columnId, task };
            }
            // 索引丢失则列内顺扫一次（列通常不大）
            const task = col.tasks.find(t => t.id === ad.id);
            if (task) return { id: ad.id, columnId: ad.columnId, task };
        }

        // 6.2 列顺序可能变了：用 columnIndex 修正 colIdx
        const idx2 = columnIndex.get(ad.columnId);
        if (idx2 != null) {
            col = board[idx2];
            const task = col.tasks.find(t => t.id === ad.id);
            if (task) {
                const fixed = { ...ad, colIdx: idx2 };
                setActiveDraft(fixed);
                activeDraftRef.current = fixed;
                return { id: ad.id, columnId: ad.columnId, task };
            }
        }

        // 6.3 兜底全板扫一次（极少发生，比如任务被拖到别列）
        for (let i = 0; i < board.length; i++) {
            const c = board[i];
            const task = c.tasks.find(t => t.id === ad.id);
            if (task) {
                const fixed = { id: ad.id, columnId: c.id, colIdx: i };
                setActiveDraft(fixed);
                activeDraftRef.current = fixed;
                return { ...fixed, task };
            }
        }

        // 6.4 找不到：被提交/删除
        setActiveDraft(null);
        activeDraftRef.current = null;
        activeColumnTaskIndexRef.current = null;
        return null;
    }

    // 7) 计算“列尾”的一个临时 order（仅用于草稿展示）
    function draftTailOrder(columnId: string): string {
        if (!board || board.length === 0) return LexoRank.min().toString();

        const col = board[columnIndex.get(columnId) ?? -1];
        if (!col || col.tasks.length === 0) return LexoRank.min().toString();
        try {
            let latestOrder = col.tasks[col.tasks.length - 1].order;
            if (!latestOrder) {
                return LexoRank.min().toString();
            }
            return LexoRank.parse(latestOrder).genNext().toString();
        } catch {
            return LexoRank.min().toString();
        }
    }

    // 8) 单一草稿策略 + 新建草稿（返回 tempId）
    function isDraftEmpty(_?: TodoTask): boolean {
        // const hasTitle = !!task.title?.trim();
        // const hasPriority = !!task.priority;
        // const hasAssignee = !!task.assignee?.length;
        // const hasDeadline = !!task.deadline;
        return false;
    }

    const generateTaskOrder = (previousOrder?: string | undefined, nextOrder?: string) => {
        if (!previousOrder) {
            return LexoRank.min().toString();
        }
        try {
            const parsedPreviousOrder = LexoRank.parse(previousOrder)
            if (!nextOrder) {
                // 如果没有指定下一个任务的顺序号，则使用 LexoRank 生成新的顺序号
                return parsedPreviousOrder.genNext().toString();
            } else {
                // 如果有指定下一个任务的顺序号，则在其前面插入新的任务
                const parsedNextOrder = LexoRank.parse(nextOrder);
                return parsedPreviousOrder.between(parsedNextOrder).toString();
            }
        } catch (error) {
            return LexoRank.min().toString();

        }
    }

    function makeOrderHint(columnId: string, afterId?: string, beforeId?: string) {
        const col = (board || []).find((c) => c.id === columnId);
        if (!col) return generateTaskOrder(); // 空列
        let prevOrder: string | undefined;
        let nextOrder: string | undefined;

        if (afterId) {
            const i = col.tasks.findIndex((t) => t.id === afterId);
            if (i !== -1) prevOrder = col.tasks[i].order;
            if (i + 1 < col.tasks.length) nextOrder = col.tasks[i + 1].order;
        } else if (beforeId) {
            const i = col.tasks.findIndex((t) => t.id === beforeId);
            if (i !== -1) nextOrder = col.tasks[i].order;
            if (i - 1 >= 0) prevOrder = col.tasks[i - 1].order;
        } else if (col.tasks.length > 0) {
            // 插末尾
            prevOrder = col.tasks[col.tasks.length - 1].order;
        }

        return generateTaskOrder(prevOrder, nextOrder);
    }

    // function tailOrderOfColumn(orders: string[]): string {
    //     if (!orders || orders.length === 0) return LexoRank.min().toString();
    //     try {
    //         return LexoRank.parse(orders[orders.length - 1]).genNext().toString();
    //     } catch {
    //         return LexoRank.min().toString();
    //     }
    // }

    async function createTask(arg: {
        columnId: string;
        afterId?: string;
        beforeId?: string;
        payload: Partial<TodoTask>;
    }) {
        if (!currentProject) return;
        const clientTempId = genTempId();
        const orderHint = makeOrderHint(arg.columnId, arg.afterId, arg.beforeId);

        const input: CreateTaskInput = {
            column_id: arg.columnId,
            workspace_id: workspaceId,
            after_id: arg.afterId,
            before_id: arg.beforeId,
            order_hint: orderHint,
            client_temp_id: clientTempId,
            project_id: currentProject.id,
            payload: arg.payload,
        };

        return await createTaskMutation.mutateAsync(input);
    }

    // function computeDraftTailOrder(columnId: string): string {
    //     const col = (board || []).find(c => c.id === columnId);
    //     if (!col) return generateTaskOrder();
    //     const orders = col.tasks.map(t => t.order).filter(Boolean) as string[];
    //     return tailOrderOfColumn(orders);
    // }

    async function startDraftTask(columnId: string, opts: StartDraftOptions = {}): Promise<string> {
        const single = opts.single ?? 'block';
        if (!currentProject) return '';
        const key = ['project-board', currentProject.id] as const;

        const active = getActiveDraftFast();
        if (active) {
            // 已存在草稿
            if (single === 'block') return active.id;
            if (single === 'cancel') {
                // 取消旧草稿
                queryClient.setQueryData<ProjectBoard>(key, (old = []) =>
                    removeTaskById(old, active.columnId, active.id),
                );
                setActiveDraft(null);
            }
            if (single === 'submit') {
                if (isDraftEmpty(active.task)) return active.id;
                try {
                    await submitDraftTask(active.id); // 成功会清指针
                } catch {
                    // return active.id;
                }
            }
        }

        const tempId = genTempId();
        const colIdx = columnIndex.get(columnId) ?? 0;
        const order = draftTailOrder(columnId);
        queryClient.setQueryData<ProjectBoard>(key, (old = []) =>
            addTaskToColumnEnd(old, columnId, {
                id: tempId,
                columnId,
                title: '',
                description: '',
                priority: undefined,
                deadline: null,
                order,
                isEdit: true,
                isDraft: true,
            }),
        );
        setActiveDraft({ id: tempId, columnId, colIdx });
        return tempId;
    }

    async function submitDraftTask(tempId: string, params?: SubmitExtraParams) {
        if (!currentProject || !board) return;
        const key = ['project-board', currentProject.id] as const;

        // 若指针失效，兜底全板找一次
        const current = queryClient.getQueryData<ProjectBoard>(key) ?? [];
        const found = findTask(current, tempId);
        if (!found) return;

        const col = board[columnIndex.get(found.columnId) ?? -1];
        if (!col) return;

        const idx =
            activeColumnTaskIndexRef.current?.get(tempId) ??
            col.tasks.findIndex(t => t.id === tempId);

        const prevOrder = idx > 0 ? col.tasks[idx - 1].order : undefined;
        const nextOrder = idx + 1 < col.tasks.length ? col.tasks[idx + 1].order : undefined;
        const afterId = idx > 0 ? col.tasks[idx - 1].id : undefined;
        const beforeId = idx + 1 < col.tasks.length ? col.tasks[idx + 1].id : undefined;
        const orderHint = generateTaskOrder(prevOrder, nextOrder);

        // 简单校验：标题必填（按需扩展）
        // const title = found.task.title?.trim() ?? '';
        // if (!title) {
        //     // 这里你可以触发 toast
        //     // toast.error('Title is required');
        //     return;
        // }

        // 提交前：先退出编辑态，提升感知（可选）
        if (found.task.isEdit) {
            queryClient.setQueryData<ProjectBoard>(key, (old = []) => {
                let res = replaceTaskById(old, found.columnId, tempId, { isEdit: false, _optimistic: true })
                return res;
            },
            );
        }

        const input: CreateTaskInput = {
            column_id: found.columnId,
            client_temp_id: tempId,
            order_hint: orderHint,
            workspace_id: workspaceId,
            after_id: afterId,
            before_id: beforeId,
            project_id: currentProject.id,
            payload: {
                title: found.task.title,
                description: found.task.description,
                priority: found.task.priority,
                deadline: found.task.deadline,
                ...params,
            },
        };
        await createTaskMutation.mutateAsync(input);
    }

    function updateDraftTask(taskID: string, patch: Partial<TodoTask>) {
        if (!currentProject) return;
        const key = ['project-board', currentProject.id] as const;
        const current = queryClient.getQueryData<ProjectBoard>(key) ?? [];
        const found = findTask(current, taskID);
        if (!found) return;
        queryClient.setQueryData<ProjectBoard>(key, (old = []) => replaceTaskById(old, found.columnId, taskID, patch));
    }

    const createTaskMutation = useMutation({
        mutationFn: async (input: CreateTaskInput) => {
            return await createTaskRequest(input);
        },
        onSuccess: (res, input) => {
            if (!currentProject) return;
            const key = ['project-board', currentProject.id] as const;
            // 用服务端返回替换草稿（id / order / 去掉 isDraft,isEdit）
            queryClient.setQueryData<ProjectBoard>(key, (old = []) =>
                replaceTaskById(old, input.column_id, input.client_temp_id, {
                    ...res,
                    id: res.id,
                    order: res.order,
                    isDraft: false,
                    isEdit: false,
                    _optimistic: undefined,
                }),
            );
        },
        onError: (_err, input) => {
            if (!currentProject) return;
            const key = ['project-board', currentProject.id] as const;
            // 提交失败：保留草稿 & 维持编辑态，方便用户修正后再试
            queryClient.setQueryData<ProjectBoard>(key, (old = []) =>
                replaceTaskById(old, input.column_id, input.client_temp_id, {
                    isEdit: true,
                    isDraft: true,
                    _optimistic: undefined,
                }),
            );
        }
    });
    const stableColumns = useMemo(() => board || [], [board]);

    return {
        columns: stableColumns,
        projectList: projectList || [],
        createTask,
        updateDraftTask,
        startDraftTask,
        submitDraftTask,
        activeOverlay,
        setActiveOverlay,
        currentProject: currentProject,
        isLoading: isLoadingProjects || isLoadingBoard,
        ...rest,
    };
}
