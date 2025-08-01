import { getWorkspaceMembersRequest } from "@/features/api/workspace";
import { useInfiniteQuery } from "@tanstack/react-query";

export const useWorkspaceMembers = (
    workspaceId: string,
    params = { limit: 10, keywords: '' }
) =>
    useInfiniteQuery({
        queryKey: ['workspaceMembers', workspaceId, params.keywords],
        queryFn: ({ pageParam = 0 }) =>
            getWorkspaceMembersRequest(workspaceId, params.limit, pageParam as number, params.keywords),
        getNextPageParam: (last: any) =>
            last.offset + params.limit < last.total ? last.offset + params.limit : undefined,
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
    });
