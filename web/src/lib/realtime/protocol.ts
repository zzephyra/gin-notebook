// WebSocket 协议定义（和后端对齐）

export type UserPresence = {
    user_id: string;       // 注意：后端是 string 化的
    name: string;
    avatar: string;
    last_seen: number;
};

export type OnlineMap = Record<string, UserPresence[]>; // taskId -> users[]

export type Incoming =
    | {
        type: 'presence_state';
        room: string; // project_presence:{projectId}
        payload: { online: OnlineMap };
    }
    | { type: 'pong'; room?: string };

export type Outgoing =
    | { type: 'subscribe'; rooms: string[] }
    | { type: 'unsubscribe'; rooms: string[] }
    | { type: 'focus_task'; project_id: string; task_id: string }
    | { type: 'blur_task'; project_id: string; task_id: string }
    | { type: 'ping' };

export const roomProject = (projectId: string) => `project_presence:${projectId}`;