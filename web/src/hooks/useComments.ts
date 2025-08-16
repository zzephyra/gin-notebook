import { Comment } from '@/components/comment/main/type';
import { createTaskCommentRequest, deleteTasksCommentRequest, getTasksCommentRequest, updateCommentRequest } from '@/features/api/comment';
import { TaskCommentData, TaskCommentEditableData, TaskCommentParams } from '@/features/api/type';
import { useInfiniteQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';

export interface TaskCommentsController {
    isLoading: boolean;
    isFetching: boolean;
    isFetchingNextPage: boolean;
    isError: boolean;
    createComment: UseMutationResult<Comment, unknown, TaskCommentData>;
    comments: Comment[];
    total: number;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    deleteComment: UseMutationResult<void, unknown, string>;
    updateComment: UseMutationResult<Comment, unknown, { commentID: string; patch: Partial<TaskCommentEditableData> }>;
}

type RawPage = {
    code: number;
    data: { comments: Comment[]; total: number };
    message: string;
};


export function useTaskCommentsController(params: TaskCommentParams, opts?: { enabled?: boolean }): TaskCommentsController {
    const qc = useQueryClient();
    const enabled = opts?.enabled ?? true;

    const key = (taskId: string, params: TaskCommentParams) => ['comments', taskId, {
        workspace_id: params.workspace_id,
        member_id: params.member_id,
        limit: params.limit,
        order_by: params.order_by,
        order: params.order,
        kw: params.kw,
        mention_me: params.mention_me,
        has_attachment: params.has_attachment,
    }];
    const qk = key(params.task_id, params);
    const commentsQuery = useInfiniteQuery({
        queryKey: qk,
        queryFn: () => getTasksCommentRequest(params),
        enabled,
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage, allPages) => {
            const pageSize = params.limit;
            if (lastPage.data.comments.length < pageSize) return undefined; // 没有下一页
            return allPages.length * pageSize; // 下一个 offset
        },
        select: (data) => {
            return {
                items: data.pages.flatMap(p => p.data.comments),
                total: data.pages[0]?.data.total ?? 0,
                _raw: data
            };
        }
    });

    const removeFromCache = (id: string) => {
        let removed = false;
        setRaw(old => {
            const pages = old.pages.map((p: RawPage) => {
                const before = p.data.comments.length;
                const after = p.data.comments.filter(c => c.id !== id);
                if (after.length !== before) removed = true;
                return { ...p, data: { ...p.data, comments: after } };
            });
            // 删除到了，就把 total -1
            if (removed && pages.length > 0) {
                pages[0] = { ...pages[0], data: { ...pages[0].data, total: Math.max(0, (pages[0].data.total ?? 0) - 1) } };
            }
            return { ...old, pages };
        });

    };

    function setRaw(updater: (raw: { pages: RawPage[]; pageParams: any[] }) => { pages: RawPage[]; pageParams: any[] } | void) {
        qc.setQueryData(qk, (old: any) => {
            if (!old || !Array.isArray(old.pages)) return old;
            const next = updater(old);
            return next ?? old;
        });
    }

    function replaceInCache(server: Comment) {
        let replaced = false;
        setRaw(old => {
            const pages = old.pages.map((p: RawPage) => {
                const idx = p.data.comments.findIndex(c => c.id === server.id);
                if (idx >= 0) {
                    const nextComments = [...p.data.comments];
                    nextComments[idx] = server;
                    replaced = true;
                    return { ...p, data: { ...p.data, comments: nextComments } };
                }
                return p;
            });
            // 如果没找到，通常是新建时：把它插入第一页头部（按 created_at desc）
            if (!replaced && pages.length > 0) {
                const first = pages[0];
                const nextFirst = {
                    ...first,
                    data: { ...first.data, comments: [server, ...first.data.comments], total: (first.data.total ?? 0) + 1 },
                };
                return { ...old, pages: [nextFirst, ...pages.slice(1)] };
            }
            return { ...old, pages };
        });
    }
    const upsertToCache = (c: Comment, mode: 'prepend' | 'replace') => {
        qc.setQueryData(qk, (old: any) => {
            if (!old?.pages) return old;
            const pages = old.pages.map((p: any) => ({ ...p }));
            if (mode === 'replace') {
                for (const p of pages) {
                    const i = p.items.findIndex((x: Comment) => x.id === c.id);
                    if (i >= 0) { p.items[i] = c; break; }
                }
            } else {
                pages[0] = { ...pages[0], items: [c, ...pages[0].items] };
            }
            return { ...old, pages };
        });
    };

    // 2) 新建
    const createComment = useMutation({
        mutationFn: (payload: TaskCommentData) => createTaskCommentRequest(payload),
        onSuccess: (created) => {
            replaceInCache(created.data)
        },
    });


    const updateComment = useMutation({
        mutationFn: ({ commentID, patch }: { commentID: string; patch: Partial<TaskCommentEditableData> }) => updateCommentRequest(params.task_id, commentID, patch),
        onMutate: async ({ commentID, patch }) => {
            await qc.cancelQueries({ queryKey: qk });
            const prev = qc.getQueryData(qk);
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;
                const pages = old.pages.map((p: any) => ({
                    ...p,
                    items: p.items.map((c: Comment) => c.id === commentID ? { ...c, ...patch } : c),
                }));
                return { ...old, pages };
            });
            return { prev };
        },
        onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qk, ctx.prev); },
        onSuccess: (server) => upsertToCache(server, 'replace'),
    });

    const deleteComment = useMutation({
        mutationFn: (commentID: string) => deleteTasksCommentRequest(params.task_id, commentID, params.workspace_id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: [] });
            const prev = qc.getQueryData(qk);
            removeFromCache(id);
            return { prev };
        },
        onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(qk, ctx.prev); },
        onSettled: () => qc.invalidateQueries({ queryKey: qk }),
    });

    return {
        isLoading: commentsQuery.isLoading,
        isFetching: commentsQuery.isFetching,
        isFetchingNextPage: commentsQuery.isFetchingNextPage,
        isError: commentsQuery.isError,
        createComment,
        comments: commentsQuery.data?.items ?? [],
        total: commentsQuery.data?.total ?? 0,
        fetchNextPage: commentsQuery.fetchNextPage,
        hasNextPage: commentsQuery.hasNextPage,
        deleteComment,
        updateComment,
    }
}