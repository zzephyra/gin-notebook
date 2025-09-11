// WebSocket 协议定义（和后端对齐）

export type UserPresence = {
    user_id: string;       // 注意：后端是 string 化的
    name: string;
    avatar: string;
    last_seen: number;
};

export type OnlineMap = Record<string, UserPresence[]>; // taskId -> users[]

// 前端发出去的
export type Outgoing =
    { type: "presence_state", room: string, payload: { online: OnlineMap } }
    | { type: 'subscribe'; rooms: string[] }
    | { type: 'unsubscribe'; rooms: string[] }
    | { type: 'focus_task'; project_id: string; task_id: string }
    | { type: 'blur_task'; project_id: string; task_id: string }
    | { type: 'add_comment'; project_id: string; task_id: string; comment_id: string }
    | { type: 'remove_comment'; project_id: string; task_id: string; comment_id: string }
    | { type: 'ping' };

// 前端收到的
export type Incoming =
    | { type: 'presence_state'; room: string; payload: { online: OnlineMap } }
    | { type: 'comment_added'; room: string; payload: any }   // 你后端有广播这个
    | { type: 'comment_removed'; room: string; payload: any } // 以后可能扩展
    | { type: 'pong'; room?: string };

export const roomProject = (projectId: string) => `project_presence:${projectId}`;
export const roomTask = (tid: string) => `task_events:${tid}`;