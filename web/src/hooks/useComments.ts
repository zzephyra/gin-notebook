import { getPercent } from '@/components/comment/input/script';
import { Comment, CommentAttachment } from '@/components/comment/main/type';
import { createAttachmentRequest, createTaskCommentRequest, deleteTasksCommentRequest, getTasksCommentRequest, updateCommentRequest } from '@/features/api/comment';
import { TaskCommentData, TaskCommentEditableData, TaskCommentParams } from '@/features/api/type';
import { UploadFile } from '@/lib/upload';
import { UploadResult } from '@/lib/upload/type';
import { hashFilesSHA256 } from '@/utils/hashFiles';
import { useInfiniteQuery, useMutation, useQueryClient, UseMutationResult, UseMutateFunction } from '@tanstack/react-query';

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
    createCommentAttachment: UseMutationResult<UploadResult, Error, { file: File; commentID: string; opt?: { from: "input" | "box" } }, { prev: unknown; }>
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
                    const i = p.data.comments.findIndex((x: Comment) => x.id === c.id);
                    if (i >= 0) { p.data.comments[i] = c; break; }
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
        mutationFn: ({ commentID, patch }: { commentID: string; patch: Partial<TaskCommentEditableData> }) => updateCommentRequest(params.workspace_id, params.task_id, commentID, patch),
        onMutate: async ({ commentID, patch }) => {
            await qc.cancelQueries({ queryKey: qk });
            const prev = qc.getQueryData(qk);
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;

                const pages = old.pages.map((p: RawPage) => {
                    const idx = p.data.comments.findIndex((c) => c.id === commentID);
                    if (idx < 0) return p;
                    const next = [...p.data.comments];
                    next[idx] = { ...next[idx], ...patch };
                    return { ...p, data: { ...p.data, comments: next } };

                });
                return { ...old, pages };
            });
            return { prev };
        },
        onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qk, ctx.prev); },
        onSuccess: (server) => {
            upsertToCache(server.data, 'replace');
        },
    });

    function updateAttachment(old: any, commentID: string, tmpId: string, patch: any) {
        if (!old?.pages) return old;
        return {
            ...old,
            pages: old.pages.map((page: any) => ({
                ...page,
                data: {
                    ...page.data,
                    comments: page.data.comments.map((c: any) =>
                        c.id === commentID
                            ? {
                                ...c,
                                attachments: c.attachments.map((a: any) =>
                                    a.id === tmpId ? { ...a, ...patch } : a
                                ),
                            }
                            : c
                    ),
                }
            })),
        };
    }


    const createCommentAttachment = useMutation<
        any, // 返回值类型
        Error, // 错误类型
        { file: File; commentID: string, opt?: { from: "input" | "box" } }, // 外部调用变量
        { prev: any; tmpId: string; controller: ReturnType<typeof UploadFile>; fileHash: string } // context
    >({
        // mutationFn 不做实际逻辑，只返回一个 promise 占位
        mutationFn: async (_vars) => {
            return new Promise((resolve) => resolve(null));
        },

        onMutate: async ({ file, commentID, opt }) => {
            await qc.cancelQueries({ queryKey: qk });

            const prev = qc.getQueryData(qk);
            const tmpId = globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`;

            // ✅ 计算文件 hash
            const fileHash = (await hashFilesSHA256([file]))[0].sha256;

            // ✅ 创建上传 controller
            const controller = UploadFile({ file });

            // ✅ 绑定进度和错误事件
            const off = controller.on((e) => {
                if (e.type === "progress") {
                    const p = getPercent(e.progress);
                    qc.setQueryData(qk, (old: any) =>
                        updateAttachment(old, commentID, tmpId, { progress: p })
                    );
                } else if (e.type === "error") {
                    qc.setQueryData(qk, (old: any) =>
                        updateAttachment(old, commentID, tmpId, {
                            status: "failed",
                            error: String(e.error),
                        })
                    );
                    off();
                }
            });

            // ✅ 乐观插入一条 uploading 附件
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: {
                            ...page.data,
                            comments: page.data.comments.map((c: any) =>
                                c.id === commentID
                                    ? {
                                        ...c,
                                        attachments: [
                                            ...(c.attachments ?? []),
                                            {
                                                id: tmpId,
                                                url: "",
                                                name: file.name,
                                                size: file.size,
                                                type: file.type,
                                                status: "uploading",
                                                progress: 0,
                                                sha256_hash: fileHash,
                                                from: opt?.from || "box",
                                            },
                                        ],
                                    }
                                    : c
                            ),
                        },
                    })),
                };
            });

            // ✅ 返回 context
            return { prev, tmpId, controller, fileHash };
        },

        onSuccess: async (_data, vars, ctx) => {
            if (!ctx) return;
            try {
                // ✅ 等待上传完成
                const result = await ctx.controller.promise;

                // ✅ 调后端 API，传 ctx.fileHash，而不是 result.sha256
                const attachment = await createAttachmentRequest(
                    params.task_id,
                    vars.commentID,
                    {
                        url: result.url,
                        key: result.key,
                        name: vars.file.name,
                        size: vars.file.size,
                        type: vars.file.type,
                        sha256_hash: ctx.fileHash,
                        workspace_id: params.workspace_id,
                    }
                );

                // ✅ 替换临时附件
                qc.setQueryData(qk, (old: any) =>
                    updateAttachment(old, vars.commentID, ctx.tmpId, {
                        ...attachment.data,
                        status: "uploaded",
                        progress: 100,
                    })
                );
            } catch (err) {
                qc.setQueryData(qk, (old: any) =>
                    updateAttachment(old, vars.commentID, ctx.tmpId, {
                        status: "failed",
                        error: String(err),
                    })
                );
            }
        },

        onError: (err, vars, ctx) => {
            if (!ctx) return;
            qc.setQueryData(qk, (old: any) =>
                updateAttachment(old, vars.commentID, ctx.tmpId, {
                    status: "failed",
                    error: String(err),
                })
            );
        },
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
        createCommentAttachment,
    }
}