import { getTaskActivitiesRequest } from '@/features/api/project';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';


function getKey(taskID: string) {
    return ['taskActivities', taskID];
}

export default function useTaskActivity(taskID: string, workspaceID: string, limit: number = 20) {
    // const queryClient = useQueryClient();

    const fetchActivities = useInfiniteQuery({
        queryKey: getKey(taskID),
        initialPageParam: 0,
        queryFn: ({ pageParam = 0 }) => getTaskActivitiesRequest(taskID, workspaceID, limit, pageParam),
        getNextPageParam: (lastPage, allPages) => lastPage.length === 20 ? allPages.length * limit : undefined,
        enabled: !!taskID,
        staleTime: 5 * 60 * 1000,
    });


    const activities = useMemo(() => fetchActivities.data?.pages.flatMap(p => p.activities) ?? [], [fetchActivities.data]);

    return {
        activities: activities,
        fetchNextPage: fetchActivities.fetchNextPage,
        hasNextPage: fetchActivities.hasNextPage,
        isFetchingNextPage: fetchActivities.isFetchingNextPage,
        isFetching: fetchActivities.isFetching,
    };
}
