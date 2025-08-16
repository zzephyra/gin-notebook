import { getWorkspaceMembersRequest } from "@/features/api/workspace";
import { WorkspaceMember } from "@/types/workspace";
import { useInfiniteQuery, UseInfiniteQueryResult } from "@tanstack/react-query";

interface MembersPage {
    data: WorkspaceMember[];
    offset: number;   // 本页偏移
    total: number;    // 总条数
}

/** 调用端可配置的参数 */
interface UseWorkspaceMembersParams {
    limit?: number;      // 每页条数，默认 10
    keywords?: string;   // 搜索关键字
}

/** Hook 返回值，额外暴露 members（已拍平） */
type UseWorkspaceMembersResult = UseInfiniteQueryResult<WorkspaceMember[]> & {
    members: WorkspaceMember[];
};
export const useWorkspaceMembers = (
    workspaceId: string,
    { limit = 10, keywords = '' }: UseWorkspaceMembersParams = {},
): UseWorkspaceMembersResult =>
    useInfiniteQuery<MembersPage, Error, WorkspaceMember[]>({
        /** ❶ queryKey 里放入 workspaceId & keywords，确保缓存正确分片 */
        queryKey: ['workspaceMembers', workspaceId, keywords],

        /** ❷ queryFn：向后端请求指定 offset 的一页数据 */
        queryFn: ({ pageParam = 0 }) =>
            getWorkspaceMembersRequest(workspaceId, limit, (pageParam as number), keywords),

        /** ❸ 根据上一页返回值推算下一页 offset，没有下一页则返回 undefined */
        getNextPageParam: (last) =>
            last.offset + limit < last.total ? last.offset + limit : undefined,

        /** ❹ 初始页从 0 开始 */
        initialPageParam: 0,

        /** ❺ 只在 workspaceId 有效时才触发请求，否则完全跳过 */
        enabled: Boolean(workspaceId),

        /** ❻ 五分钟内视为新鲜数据 */
        staleTime: 5 * 60 * 1000,

        /**
         * ❼ select 可以把原始返回结果加工后再交给 useInfiniteQuery
         * 这里直接拍平成 WorkspaceMember[]，这样组件直接拿到的 data
         * 就已经是一维数组了
         */
        select: (data) => data.pages.flatMap((page) => page.data) || [],
    }) as unknown as UseWorkspaceMembersResult;