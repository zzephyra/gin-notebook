import { useEffect, useState, useCallback } from "react";
import { getRealtime, roomProject } from "@/lib/realtime/connection"; // 按你的路径改
import type { Incoming, OnlineMap, RealtimeOptions } from "@/lib/realtime";
import { websocketApi } from "@/features/api/routes";
import { BASE_URL } from "@/lib/api/client";


export default function useWorkspacePresence(workspaceId: string) {
    const [onlineMap, setOnlineMap] = useState<OnlineMap>({});
    const wsOpt: RealtimeOptions = { api: websocketApi(BASE_URL), defaultQuery: { workspace_id: workspaceId } }
    const rt = getRealtime(wsOpt);

    useEffect(() => {
        const onMsg = (msg: Incoming) => {
            console.log("presence msg:", msg);
            if (msg.type === "presence_state") {
                setOnlineMap(msg.payload?.online ?? {});
            }
        };

        rt.on(onMsg);

        return () => {
            rt.off(onMsg);
        };
    }, [workspaceId]);

    const getTaskViewers = useCallback(
        (taskId: string) => onlineMap[taskId] ?? [],
        [onlineMap]
    );

    const focusTask = (projectId: string, taskId: string) => {
        rt.subscribe(roomProject(projectId));
        rt.focusTask(projectId, taskId)
    };
    const blurTask = (projectId: string, taskId: string) => {
        rt.subscribe(roomProject(projectId));

        rt.blurTask(projectId, taskId)
    };

    return { onlineMap, getTaskViewers, focusTask, blurTask };
}
