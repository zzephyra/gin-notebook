import { useMemo } from "react";
import { getPercent } from '@/components/comment/input/script';
import { Comment } from '@/components/comment/main/type';
import {
    createAttachmentRequest,
    createOrUpdateCommentLikeRequest,
    createTaskCommentRequest,
    deleteCommentLikeRequest,
    deleteTasksCommentRequest,
    getTasksCommentRequest,
    updateCommentRequest
} from '@/features/api/comment';
import { TaskCommentData, TaskCommentEditableData, TaskCommentParams } from '@/features/api/type';
import { UploadFile } from '@/lib/upload';
import { UploadResult } from '@/lib/upload/type';
import { hashFilesSHA256 } from '@/utils/hashFiles';
import { useInfiniteQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';

export interface TaskCommentsController {
    isLoading: boolean;
    isFetching: boolean;
    isFetchingNextPage: boolean;
    isError: boolean;
    createComment: UseMutationResult<{ code: number; data: Comment; message: string }, unknown, TaskCommentData>;
    comments: Comment[];
    total: number;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    deleteComment: UseMutationResult<void, unknown, string>;
    updateComment: UseMutationResult<{ code: number; data: Comment; message: string }, unknown, { commentID: string; patch: Partial<TaskCommentEditableData> }>;
    createCommentAttachment: UseMutationResult<
        UploadResult,
        Error,
        { file: File; commentID: string; opt?: { from: "input" | "box" } },
        { prev: any; tmpId: string; controller: ReturnType<typeof UploadFile>; fileHash: string }
    >;
    toggleCommentReaction: UseMutationResult<{ code: number; data: Comment; message: string }, unknown, { commentID: string; like?: boolean }>;
}

type RawPage = {
    code: number;
    data: { comments: Comment[]; total: number };
    message: string;
};

export function useTaskCommentsController(params: TaskCommentParams & { offset?: number }, opts?: { enabled?: boolean }): TaskCommentsController {
    const qc = useQueryClient();
    const enabled = opts?.enabled ?? true;

    const key = (taskId: string, p: TaskCommentParams) => [
        'comments',
        taskId,
        {
            workspace_id: p.workspace_id,
            member_id: p.member_id,
            limit: p.limit,
            order_by: p.order_by,
            order: p.order,
            kw: p.kw,
            mention_me: p.mention_me,
            has_attachment: p.has_attachment,
        },
    ];
    const qk = key(params.task_id, params);

    const commentsQuery = useInfiniteQuery({
        queryKey: qk,
        // 关键：正确使用 pageParam 作为 offset
        queryFn: ({ pageParam = 0 }) => getTasksCommentRequest({ ...params, offset: pageParam as number }),
        enabled,
        initialPageParam: 0 as number,
        getNextPageParam: (lastPage: RawPage, allPages: RawPage[]) => {
            const limit = params.limit ?? 20;
            const total = allPages[0]?.data?.total ?? Infinity;
            const loaded = allPages.reduce((acc, p) => acc + (p.data?.comments || []).length, 0);
            if (loaded >= total) return undefined;               // 全部加载完
            if ((lastPage.data?.comments || []).length < limit) return undefined; // 后端返回小于 pageSize，也视为没有下一页
            return loaded; // 下一次的 offset = 已加载的条数
        },
    });

    // —— 工具：对 React Query 的 raw 结构做安全 set
    function setRaw(
        updater: (raw: { pages: RawPage[]; pageParams: any[] }) => { pages: RawPage[]; pageParams: any[] } | void
    ) {
        qc.setQueryData(qk, (old: any) => {
            if (!old || !Array.isArray(old.pages)) return old;
            const next = updater(old);
            return next ?? old;
        });
    }

    // —— 删除：从所有页移除 id，并同步更新第一页的 total
    const removeFromCache = (id: string) => {
        let removed = false;
        setRaw(old => {
            const pages = old.pages.map((p: RawPage) => {
                const before = p.data.comments.length;
                const after = p.data.comments.filter(c => c.id !== id);
                if (after.length !== before) removed = true;
                return { ...p, data: { ...p.data, comments: after } };
            });
            if (removed && pages.length > 0) {
                pages[0] = {
                    ...pages[0],
                    data: { ...pages[0].data, total: Math.max(0, (pages[0].data.total ?? 0) - 1) },
                };
            }
            return { ...old, pages };
        });
    };

    // —— 替换（或插入到第一页头部）
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

            if (!replaced && pages.length > 0) {
                const first = pages[0];
                const exists = first.data.comments.some(c => c.id === server.id);
                const nextFirst = exists
                    ? first
                    : {
                        ...first,
                        data: {
                            ...first.data,
                            comments: [server, ...first.data.comments],
                            total: (first.data.total ?? 0) + 1,
                        },
                    };
                return { ...old, pages: [nextFirst, ...pages.slice(1)] };
            }
            return { ...old, pages };
        });
    }

    // —— 仅替换（不插入）
    const upsertToCache = (c: Comment, mode: 'prepend' | 'replace') => {
        qc.setQueryData(qk, (old: any) => {
            if (!old?.pages) return old;
            const pages = old.pages.map((p: RawPage) => ({ ...p, data: { ...p.data, comments: [...p.data.comments] } }));

            if (mode === 'replace') {
                outer: for (const p of pages) {
                    const i = p.data.comments.findIndex((x: any) => x.id === c.id);
                    if (i >= 0) {
                        p.data.comments[i] = c;
                        break outer;
                    }
                }
            } else {
                // prepend：插入到第一页头部（一般用于立即显示新建）
                pages[0].data.comments = [c, ...pages[0].data.comments];
                pages[0].data.total = (pages[0].data.total ?? 0) + 1;
            }
            return { ...old, pages };
        });
    };

    // —— 新建评论
    const createComment = useMutation({
        mutationFn: (payload: TaskCommentData) => createTaskCommentRequest(payload),
        onSuccess: (created) => {
            replaceInCache(created.data);
        },
    });

    // —— 更新评论（乐观更新 + 回滚 + 服务端结果覆盖）
    const updateComment = useMutation({
        mutationFn: ({ commentID, patch }: { commentID: string; patch: Partial<TaskCommentEditableData> }) =>
            updateCommentRequest(params.workspace_id, params.task_id, commentID, patch),
        onMutate: async ({ commentID, patch }) => {
            await qc.cancelQueries({ queryKey: qk });
            const prev = qc.getQueryData(qk);
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;
                const pages = old.pages.map((p: RawPage) => {
                    const idx = p.data.comments.findIndex(c => c.id === commentID);
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
        onSuccess: (server) => { upsertToCache(server.data, 'replace'); },
    });

    const toggleCommentReaction = useMutation({
        // 并发：序列化/去重
        retry: 0,
        mutationFn: ({ commentID, like }: { commentID: string; like?: boolean }) => {
            return like === undefined
                ? deleteCommentLikeRequest(params.task_id, commentID, params.workspace_id)
                : createOrUpdateCommentLikeRequest(params.task_id, commentID, params.workspace_id, like);
        },

        onMutate: async ({ commentID, like }) => {
            // 1) 取消在途查询避免覆盖
            await qc.cancelQueries({ queryKey: qk, exact: true });

            const prev = qc.getQueryData(qk);
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;

                const pages = old.pages.map((p: RawPage) => {
                    const comments = p?.data?.comments ?? [];
                    const idx = comments.findIndex((c: any) => c.id === commentID);
                    if (idx < 0) return p;

                    const nextComments = [...comments];
                    const cur = nextComments[idx];

                    const likedByMe = !!cur.liked_by_me;
                    const dislikedByMe = !!cur.disliked_by_me;

                    const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
                    let likesCount = toNum(cur.likes);
                    let dislikesCount = toNum(cur.dislikes);

                    if (like === undefined) {
                        // 取消赞或踩
                        if (likedByMe) likesCount -= 1;
                        if (dislikedByMe) dislikesCount -= 1;

                        nextComments[idx] = {
                            ...cur,
                            likes: Math.max(0, likesCount),
                            dislikes: Math.max(0, dislikesCount),
                            liked_by_me: false,
                            disliked_by_me: false,
                        };
                    } else if (like) {
                        // 踩->赞 或 无->赞
                        if (!likedByMe) likesCount += 1;
                        if (dislikedByMe) dislikesCount -= 1;

                        nextComments[idx] = {
                            ...cur,
                            likes: Math.max(0, likesCount),
                            dislikes: Math.max(0, dislikesCount),
                            liked_by_me: true,
                            disliked_by_me: false,
                        };
                    } else {
                        // 赞->踩 或 无->踩
                        if (!dislikedByMe) dislikesCount += 1;
                        if (likedByMe) likesCount -= 1;

                        nextComments[idx] = {
                            ...cur,
                            likes: Math.max(0, likesCount),
                            dislikes: Math.max(0, dislikesCount),
                            liked_by_me: false,
                            disliked_by_me: true,
                        };
                    }

                    return { ...p, data: { ...p.data, comments: nextComments } };
                });

                return { ...old, pages };
            });

            return { prev };
        },

        onError: (_e, _vars, ctx) => {
            if (ctx?.prev) qc.setQueryData(qk, ctx.prev);
        },

        onSuccess: (server) => {
            // 用服务端返回兜底（确保结构匹配你的 upsertToCache）
            if (server?.data) upsertToCache(server.data, 'replace');
        },

    });


    // —— 上传附件时在缓存里更新某条附件
    function updateAttachment(old: any, commentID: string, tmpId: string, patch: any) {
        if (!old?.pages) return old;
        return {
            ...old,
            pages: old.pages.map((page: RawPage) => ({
                ...page,
                data: {
                    ...page.data,
                    comments: page.data.comments.map((c: any) =>
                        c.id === commentID
                            ? {
                                ...c,
                                attachments: (c.attachments ?? []).map((a: any) =>
                                    a.id === tmpId ? { ...a, ...patch } : a
                                ),
                            }
                            : c
                    ),
                },
            })),
        };
    }

    // —— 创建评论附件（带进度、失败、替换临时项）
    const createCommentAttachment = useMutation<
        UploadResult,
        Error,
        { file: File; commentID: string; opt?: { from: "input" | "box" } },
        { prev: any; tmpId: string; controller: ReturnType<typeof UploadFile>; fileHash: string }
    >({
        mutationFn: async () => {
            // 真正上传走 onSuccess 中的 controller.promise，这里只占位
            return Promise.resolve({} as UploadResult);
        },
        onMutate: async ({ file, commentID, opt }) => {
            await qc.cancelQueries({ queryKey: qk });

            const prev = qc.getQueryData(qk);
            const tmpId = globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`;
            const fileHash = (await hashFilesSHA256([file]))[0].sha256;
            const controller = UploadFile({ file });

            // 绑定进度 & 错误
            const off = controller.on((e) => {
                if (e.type === "progress") {
                    const p = getPercent(e.progress);
                    qc.setQueryData(qk, (old: any) => updateAttachment(old, commentID, tmpId, { progress: p }));
                } else if (e.type === "error") {
                    qc.setQueryData(qk, (old: any) =>
                        updateAttachment(old, commentID, tmpId, { status: "failed", error: String(e.error) })
                    );
                    off();
                }
            });

            // 乐观插入一个 uploading 附件
            qc.setQueryData(qk, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: RawPage) => ({
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

            return { prev, tmpId, controller, fileHash };
        },
        onSuccess: async (_ignored, vars, ctx) => {
            if (!ctx) return;
            try {
                // 等待上传完成
                const result = await ctx.controller.promise;

                // 后端登记附件（注意：使用 ctx.fileHash）
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

                // 替换临时附件为已完成
                qc.setQueryData(qk, (old: any) =>
                    updateAttachment(old, vars.commentID, ctx.tmpId, {
                        ...attachment.data,
                        status: "uploaded",
                        progress: 100,
                    })
                );
            } catch (err) {
                qc.setQueryData(qk, (old: any) =>
                    updateAttachment(old, vars.commentID, ctx.tmpId, { status: "failed", error: String(err) })
                );
            }
        },
        onError: (err, vars, ctx) => {
            if (!ctx) return;
            qc.setQueryData(qk, (old: any) =>
                updateAttachment(old, vars.commentID, ctx.tmpId, { status: "failed", error: String(err) })
            );
        },
    });

    // —— 删除评论
    const deleteComment = useMutation({
        mutationFn: (commentID: string) => deleteTasksCommentRequest(params.task_id, commentID, params.workspace_id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: qk }); // 只取消当前列表的查询
            const prev = qc.getQueryData(qk);
            removeFromCache(id);
            return { prev };
        },
        onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(qk, ctx.prev); },
        onSettled: () => qc.invalidateQueries({ queryKey: qk }),
    });

    // —— 扁平化一次，外部直接使用
    const comments = useMemo(
        () => commentsQuery.data?.pages.flatMap(p => (p.data?.comments || [])) ?? [],
        [commentsQuery.data]
    );
    const total = commentsQuery.data?.pages?.[0]?.data?.total ?? 0;

    return {
        isLoading: commentsQuery.isLoading,
        isFetching: commentsQuery.isFetching,
        isFetchingNextPage: commentsQuery.isFetchingNextPage,
        isError: commentsQuery.isError,
        createComment,
        comments,
        total,
        fetchNextPage: commentsQuery.fetchNextPage,
        hasNextPage: !!commentsQuery.hasNextPage,
        deleteComment,
        updateComment,
        toggleCommentReaction,
        createCommentAttachment,
    };
}
