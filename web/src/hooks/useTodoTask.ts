import { ColumnUpdatePayload, CreateTaskInput, Project, ProjectBoard, SubmitExtraParams, TaskUpdatePayload, TodoTask, UpdateOptions } from '@/components/todo/type'
import { cleanColumnTasksRequest, createTaskRequest, getProjectBoardRequest, getProjectsListRequest, getProjectsRequest, updateProjectColumnRequest, updateProjectRequest, updateTaskRequest } from '@/features/api/project'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LexoRank } from "lexorank";
import { addTaskToColumnEnd, findTask, removeTaskById, replaceColumnById, replaceTaskById } from '@/utils/boardPatch'
import { responseCode } from '@/features/constant/response';
import { getRealtime, Incoming, OnlineMap, RealtimeOptions, roomProject } from '@/lib/realtime';
import { websocketApi } from '@/features/api/routes';
import { BASE_URL } from '@/lib/api/client';
import { updateProjectSettingsRequest } from '@/features/api/settings';
import { ProjectPayload, ProjectSettingsPayload } from '@/features/api/type';
import { ProjectBoardType, ProjectType, TodoParamsType } from '@/types/project';

const genTempId = () => (globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`);
export type ActiveDraftPtr = { id: string; columnId: string; colIdx: number } | null;
export type StartDraftOptions = {
    single?: 'submit' | 'cancel' | 'block'; // 默认 block
};

const getBoardQueryKey = (projectId: string, params: TodoParamsType) => ['project', 'board', projectId, params] as const;
const getProjectQueryKey = (projectId: string) => ['project', projectId] as const;

export type TodoPageType = {
    limit?: number;
    offset?: number;
}

export function useProjectTodo(projectId: string, workspaceId: string, params?: TodoParamsType) {
    const queryClient = useQueryClient();
    const [activeOverlay, setActiveOverlay] = useState(false);
    const chainsRef = useRef(new Map<string, Promise<any>>());
    const [todoParams, setTodoParams] = useState<TodoParamsType>(params || { order_by: 'priority', asc: true });
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

    const currentProjectId = useMemo(() => {
        if (projectId) {
            var t = projectList.find((p: any) => p.id === projectId);
            if (t) {
                return projectId;
            }
        }
        return projectList?.[0]?.id;
    }, [projectId, projectList]);

    // 2) 当前项目
    const {
        data: currentProject,
        isLoading: isLoadingProject,
        ...rest
    } = useQuery({
        queryKey: ['project', currentProjectId],
        queryFn: async () => {
            if (!projectId) {
                if (projectList && projectList.length > 0) {
                    projectId = projectList[0].id;
                } else {
                    return null;
                }
            };
            const res = await getProjectsRequest(projectId, workspaceId);
            return res.data; // 假设返回的是完整的 project 对象，含 todo
        },
        enabled: !!currentProjectId && !!workspaceId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: projectBoard,
        isLoading: isLoadingProjectBoard
    } = useQuery({
        queryKey: ['project', 'board', currentProjectId, todoParams],
        queryFn: async () => {
            if (!projectId) {
                if (projectList && projectList.length > 0) {
                    projectId = projectList[0].id;
                } else {
                    return null;
                }
            };
            const res = await getProjectBoardRequest(projectId, workspaceId, todoParams);
            return res.data; // 假设返回的是完整的 project 对象，含 todo
        },
        enabled: !!currentProjectId && !!workspaceId,
        staleTime: 5 * 60 * 1000,
    });

    // 3) Board（直接取 currentProject 的 todo）
    const board = useMemo(() => {
        if (!projectBoard) return [];
        return projectBoard.todo || [];
    }, [projectBoard]);


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

    function canAutoMerge(patch: Partial<TaskUpdatePayload>) {
        // 例：仅排序/指派自动重试；标题/描述等文本不自动重试
        const keys = Object.keys(patch);
        return keys.every(k => k === 'order' || k === 'assignees');
    }

    function enqueueTaskJob<T>(taskID: string, job: () => Promise<T>): Promise<T> {
        const prev = chainsRef.current.get(taskID) || Promise.resolve();
        const next = prev.finally(job);
        chainsRef.current.set(taskID, next.finally(() => {
            // 清理：链跑完了且还是当前引用，才删
            if (chainsRef.current.get(taskID) === next) chainsRef.current.delete(taskID);
        }));
        // @ts-ignore
        return next;
    }
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

    async function startDraftTask(columnId: string, opts: StartDraftOptions = {}): Promise<string> {
        const single = opts.single ?? 'block';
        if (!currentProject) return '';
        const key = getBoardQueryKey(currentProjectId, todoParams);

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
                    await submitTask(active.id); // 成功会清指针
                } catch (err) {
                    console.error('提交草稿失败', err);
                    // return active.id;
                }
            }
        }
        const tempId = genTempId();
        const colIdx = columnIndex.get(columnId) ?? 0;
        const order = draftTailOrder(columnId);
        queryClient.setQueryData<ProjectType>(key, (old: ProjectType | undefined): ProjectType | undefined => {
            if (!old || !old.todo) return old; // 如果没有缓存，保持不变（或返回一个默认值）
            const newBoard = addTaskToColumnEnd(old.todo, columnId, {
                id: tempId,
                columnId,
                title: '',
                description: '',
                priority: undefined,
                deadline: null,
                order,
                isEdit: true,
                isDraft: true,
            });
            return { ...old, todo: newBoard };
        }
        );
        setActiveDraft({ id: tempId, columnId, colIdx });
        return tempId;
    }

    async function submitTask(tempId: string, params?: SubmitExtraParams) {
        if (!currentProject || !board) return;
        const key = getBoardQueryKey(currentProjectId, todoParams);

        // 若指针失效，兜底全板找一次
        const current = queryClient.getQueryData<ProjectType>(key) ?? { todo: [] };
        console.log(current)
        const found = findTask(current?.todo, tempId);
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

        // 提交前：先退出编辑态，提升感知（可选）
        if (found.task.isEdit) {
            queryClient.setQueryData<ProjectType>(key, (old) => {
                if (!old) return old
                let res = replaceTaskById(old.todo, found.columnId, tempId, { isEdit: false, _optimistic: true })
                return {
                    ...old,
                    todo: res
                };
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

    async function updateTask(taskID: string, patch: Partial<TaskUpdatePayload>, opts?: UpdateOptions) {
        if (!currentProject) return;
        const key = getBoardQueryKey(currentProjectId, todoParams);

        // 读最新 board & 当前任务
        const snapshot = queryClient.getQueryData<ProjectBoardType>(key) ?? { todo: [] };
        const found = findTask(snapshot.todo, taskID);
        if (!found) return;
        console.log(snapshot)

        // 乐观更新：先把 UI 改了（可在 onError 时回滚/或 invalidate）
        queryClient.setQueryData<ProjectBoardType>(key,
            (old) => {
                if (!old) return old
                console.log(old)
                var newBoard = replaceTaskById(old.todo, found.columnId, taskID, { ...patch, _optimistic: true }, opts?.insertIndex)
                return {
                    ...old,
                    todo: newBoard
                }
            }
        );
        console.log(12)
        if (found.task.isDraft) {
            // 创建仅更新本地，不发请求，等待submitTask提交
            return;
        }

        const initialToken = found.task.updated_at || "";
        const columnId = found.columnId;
        // const mutationId = globalThis.crypto?.randomUUID?.() ?? `m_${Date.now()}_${Math.random()}`;

        // 同一任务的更新串行执行，避免本地并发导致 token 乱序
        await enqueueTaskJob(taskID, async () => {
            let token = initialToken;
            let attempts = 0;

            while (true) {
                // —— 发请求：这里沿用你现有的 updateTaskRequest 签名 ——
                // 👉 如果你能改 API 层，建议把 updated_at 放在 If-Match-Updated-At 头里，并把 mutationId 也作为头传下去
                const res: any = await updateTaskRequest(taskID, workspaceId, columnId, currentProject.id, token, patch /*, mutationId 可在 request 层加 header*/);

                const code = res?.code ?? res?.data?.code ?? res?.statusCode;
                const data = res?.data ?? res;
                // 成功：合并服务端返回（若无完整 task，就保持已有视图），并更新 token
                if (code === responseCode?.SUCCESS || data?.code === responseCode?.SUCCESS) {
                    const taskData = data?.task ?? {};
                    const normalizedPatch: Partial<TodoTask> = {
                        ...patch,
                        ...taskData,
                        // 字段映射（兼容后端 order_index）
                        order: (taskData as any).order ?? (taskData as any).order_index ?? (patch as any).order,
                        column_id: (taskData as any).column_id ?? (patch as any).column_id ?? columnId,
                        _optimistic: undefined,
                        _forceReplace: true, // 强制替换，避免“无变化提前返回”
                    };
                    queryClient.setQueryData<ProjectBoardType>(key, (old: ProjectBoardType | undefined) => {
                        if (!old) return old
                        var newBoard = replaceTaskById(old.todo, normalizedPatch.column_id ?? columnId, taskID, normalizedPatch, opts?.insertIndex)
                        return { ...old, todo: newBoard };
                    }
                    );
                    // 这里如果你有单独的 token 存储，也更新它；否则 token 保存在 task.updated_at 里即可
                    return;
                }

                // 冲突：拿最新 token 决定是否重试
                if (
                    code === responseCode?.ERROR_TASK_UPDATE_CONFLICTED ||
                    data?.code === responseCode?.ERROR_TASK_UPDATE_CONFLICTED ||
                    data?.data?.conflicted
                ) {
                    const latestAt =
                        data?.data?.latest_updated_at ||
                        data?.data?.lastest_updated_at ||
                        data?.data?.updated_at;

                    // 无 token → 无法重试，直接回滚/刷新
                    if (!latestAt) break;

                    // 不允许自动合并（同字段冲突）→ 回滚/提示
                    if (!canAutoMerge(patch)) {
                        // 简单处理：失效缓存让它从服务器刷最新（你也可以回滚到 snapshot）
                        queryClient.invalidateQueries({ queryKey: key });
                        return;
                    }

                    // 允许自动重试：换新 token 再试（可做次数限制 & 指数退避）
                    token = latestAt;
                    attempts++;
                    if (attempts >= 2) {
                        // 最多自动重试 2 次，避免打爆
                        break;
                    }
                    await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
                    continue;
                }

                // 其它错误：退出循环由下面兜底
                break;
            }
        });
    }


    const createTaskMutation = useMutation({
        mutationFn: async (input: CreateTaskInput) => {
            return await createTaskRequest(input);
        },
        onSuccess: (res, input) => {
            if (!currentProject) return;
            const key = getBoardQueryKey(currentProjectId, todoParams);
            // 用服务端返回替换草稿（id / order / 去掉 isDraft,isEdit）
            queryClient.setQueryData<ProjectType>(key, (old) => {
                if (!old) return old
                return {
                    ...old,
                    todo: replaceTaskById(old.todo, input.column_id, input.client_temp_id, {
                        ...res,
                        id: res.id,
                        order: res.order,
                        isDraft: false,
                        isEdit: false,
                        _optimistic: undefined,
                    })
                }
            },
            );
        },
        onError: (_err, input) => {
            if (!currentProject) return;
            const key = getBoardQueryKey(currentProjectId, todoParams);
            // 提交失败：保留草稿 & 维持编辑态，方便用户修正后再试
            queryClient.setQueryData<ProjectType>(key, (old) => {
                if (!old) return old
                return {
                    ...old,
                    todo: replaceTaskById(old.todo, input.column_id, input.client_temp_id, {
                        isEdit: true,
                        isDraft: true,
                        _optimistic: undefined,
                    })
                }
            },
            )
        }
    });

    const cleanColumnTasks = (columnId: string) => {
        if (!currentProject) return;
        const key = getBoardQueryKey(currentProjectId, todoParams);
        queryClient.setQueryData<ProjectType>(key, (old) => {
            if (!old) return old
            const colIdx = columnIndex.get(columnId);
            if (colIdx === undefined) return old;
            const newBoard = old?.todo.slice();
            newBoard[colIdx] = { ...newBoard[colIdx], tasks: [] };
            return { ...old, todo: newBoard };
        },
        )
        cleanColumnTasksRequest(columnId, workspaceId, currentProject.id);
    }

    const deleteTask = async (taskId: string, columnId: string) => {
        if (!currentProject) return;
        const key = getBoardQueryKey(currentProjectId, todoParams);
        queryClient.setQueryData<ProjectType>(key, (old) => {
            if (!old) return old
            const colIdx = columnIndex.get(columnId);
            if (colIdx === undefined) return old;
            const newBoard = old.todo.slice();
            newBoard[colIdx] = { ...newBoard[colIdx], tasks: newBoard[colIdx].tasks.filter((t: any) => t.id !== taskId) };
            return { ...old, todo: newBoard };
        },
        )
    }

    const updateColumn = async (columnId: string, patch: Partial<ColumnUpdatePayload>) => {
        if (!currentProject) return;
        const colIdx = columnIndex.get(columnId) ?? -1;
        if (colIdx === -1) return;

        const col = board?.[colIdx];
        if (!col) return;
        queryClient.setQueryData<ProjectType>(getBoardQueryKey(currentProjectId, todoParams), (old) => {
            if (!old) return old
            const newBoard = replaceColumnById(old.todo, columnId, patch);
            return { ...old, todo: newBoard };
        },
        )
        let res = await updateProjectColumnRequest(columnId, workspaceId, col.updated_at || "", currentProject.id, patch);

        if (!res.conflicted && res.column) {
            queryClient.setQueryData<ProjectType>(getBoardQueryKey(currentProjectId, todoParams), (old) => {
                if (!old) return old
                const newBoard = replaceColumnById(old.todo, columnId, res.column);
                return { ...old, todo: newBoard };
            },)
        }
        return
    }

    const stableColumns = useMemo(() => board || [], [board]);

    // === Presence 集成：state + 连接 ===
    const [onlineMap, setOnlineMap] = useState<OnlineMap>({});
    // 你的 API base（与 axios 一致）
    const API_BASE = import.meta.env.VITE_API_BASE_URL || location.origin;
    // 如果是跨站且 Cookie 不带，可选地从 localStorage 取 token（联调用；生产建议 Cookie）
    const wsOpt: RealtimeOptions = { api: websocketApi(BASE_URL), defaultQuery: { workspace_id: workspaceId } }
    // 在“当前项目变化”时订阅对应房间
    useEffect(() => {
        if (!currentProject?.id) return;
        const rt = getRealtime(wsOpt);
        const room = roomProject(currentProject.id);

        const onMsg = (msg: Incoming) => {
            if (msg.type === 'presence_state' && msg.room === room) {
                setOnlineMap(msg.payload?.online ?? {});
            }
        };

        rt.on(onMsg);
        rt.subscribe(room);
        // 初次进入可能还没消息，等服务端推第一帧；无需手动请求

        return () => { rt.unsubscribe(room); rt.off(onMsg); };
    }, [API_BASE, workspaceId, currentProject?.id]);

    // 对外暴露的 presence API
    const getTaskViewers = (taskId: string) => onlineMap[taskId] ?? [];
    const focusTask = (taskId: string) => {
        currentProject?.id && getRealtime(wsOpt).focusTask(currentProject.id, taskId)
    };
    const blurTask = (taskId: string) => currentProject?.id && getRealtime(wsOpt).blurTask(currentProject.id, taskId);


    const updateProjectSetting = useMutation({
        mutationFn: async (payload: ProjectSettingsPayload) => {
            if (!currentProjectId || !currentProject?.settings.updated_at) {
                throw new Error("Missing currentProjectId or updated_at");
            }
            return await updateProjectSettingsRequest(
                currentProjectId,
                workspaceId,
                currentProject.settings.updated_at,
                payload
            );
        },
        onMutate: async (payload: ProjectSettingsPayload) => {
            // 取消当前关于该 project 的正在进行的请求，避免竞态覆盖
            var key = getProjectQueryKey(currentProjectId)
            await queryClient.cancelQueries({ queryKey: key });

            // 取出当前缓存（快照）
            const previous = queryClient.getQueryData<Project | null>(key) ?? null;

            // 立刻在 cache 做修改 —— 乐观更新（示例假设后端返回的是整个 settings 部分）
            queryClient.setQueryData<Project | null>(key, (old) => {
                if (!old) return old;
                // 这里把 payload 合并入设置（根据你的实际结构调整）
                return {
                    ...old,
                    settings: {
                        ...old.settings,
                        ...payload,
                    },
                };
            });
            // 返回 context，onError 会接收它用于回滚
            return { previous };
        },
        onSuccess: (res) => {
            if (!res) return;
            var key = getProjectQueryKey(currentProjectId)

            queryClient.setQueryData<Project>(key, (old) => {
                if (!old) return old;
                return { ...old, settings: { ...old.settings, ...res.settings } };
            });
        },
        onError: (context: { previous: Project | null } | undefined) => {
            var key = getProjectQueryKey(currentProjectId)
            if (context?.previous) {
                queryClient.setQueryData<Project | null>(key, context.previous);
            } else {
                queryClient.invalidateQueries({ queryKey: key });
            }
        },
    })

    const updateProject = useMutation({
        mutationFn: async (payload: ProjectPayload) => {
            if (!currentProjectId || !currentProject?.updated_at) {
                throw new Error("Missing currentProjectId or updated_at");
            }
            return await updateProjectRequest(
                currentProjectId,
                workspaceId,
                currentProject.updated_at,
                payload
            );
        },
        onMutate: async (payload: ProjectPayload) => {
            // 取消当前关于该 project 的正在进行的请求，避免竞态覆盖
            var key = getProjectQueryKey(currentProjectId)
            await queryClient.cancelQueries({ queryKey: key });

            // 取出当前缓存（快照）
            const previous = queryClient.getQueryData<Project | null>(key) ?? null;

            // 立刻在 cache 做修改 —— 乐观更新（示例假设后端返回的是整个 settings 部分）
            queryClient.setQueryData<Project | null>(key, (old) => {
                if (!old) return old;
                // 这里把 payload 合并入设置（根据你的实际结构调整）
                return {
                    ...old,
                    ...payload,
                };
            });
            // 返回 context，onError 会接收它用于回滚
            return { previous };
        },
        onSuccess: (res) => {
            if (!res) return;
            var key = getProjectQueryKey(currentProjectId)
            queryClient.setQueryData<Project>(key, (old) => {
                if (!old) return old;
                return { ...old, ...res.project };
            });
        },
        onError: (context: { previous: Project | null } | undefined) => {
            var key = getProjectQueryKey(currentProjectId)

            if (context?.previous) {
                queryClient.setQueryData<Project | null>(key, context.previous);
            } else {
                queryClient.invalidateQueries({ queryKey: key });
            }
        },
    })

    // const loadNextColumnTasks = useMutation({
    //     mutationFn: async (columnId: string, payload: ProjecctPayload) => {
    //         if (!currentProjectId || !currentProject?.updated_at) {
    //             throw new Error("Missing currentProjectId or updated_at");
    //         }
    //         return await updateProjectRequest(
    //             currentProjectId,
    //             workspaceId,
    //             currentProject.updated_at,
    //             payload
    //         );
    //     },
    // })

    return {
        columns: stableColumns,
        isLoadTodo: isLoadingProjectBoard,
        projectList: projectList || [],
        todoParams,
        createTask,
        updateTask,
        deleteTask,
        startDraftTask,
        setTodoParams,
        updateProjectSetting: updateProjectSetting.mutateAsync,
        updateProject: updateProject.mutateAsync,
        submitTask,
        cleanColumnTasks,
        updateColumn,
        activeOverlay,
        setActiveOverlay,
        currentProject: currentProject,
        isLoading: isLoadingProjects || isLoadingProject,
        ...rest,

        getTaskViewers, // (taskId) => UserPresence[]
        focusTask,      // (taskId) => void
        blurTask,       // (taskId) => void
        onlineMap,      // 如需整张表渲染也可用
    };
}
