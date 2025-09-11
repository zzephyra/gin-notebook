import { Incoming, Outgoing, roomTask } from './protocol';

type Listener = (msg: Incoming) => void;

export type RealtimeOptions = {
    api: string,
    // 如果你是 Cookie 鉴权，token 不必提供；如需兜底，可提供 tokenGetter
    tokenGetter?: () => string | null;
    // 在跨站、Cookie 不带的情况下允许 ?token= 的 fallback
    allowQueryTokenFallback?: boolean;
    // 可配置的 query 参数（例如 workspace_id）
    defaultQuery?: Record<string, string>;
    // 自动重连
    reconnection?: { enabled: boolean; maxDelayMs?: number };
};

/**
 * 轻量级单例连接管理器
 * - 负责：连接/重连、发送、队列缓存、订阅恢复、心跳
 * - 不含业务：不会认识“presence”，只做事件分发
 */
export class RealtimeConnection {
    private ws: WebSocket | null = null;
    private url: string;
    private listeners = new Set<Listener>();
    private subs = new Set<string>(); // rooms
    private queue: Outgoing[] = [];
    private reconnectTimer: number | null = null;
    private backoff = 500;
    private readonly maxBackoff: number;
    private readonly reconnectionEnabled: boolean;
    private shouldReconnect = true;
    private pingTimer: number | null = null;
    private tokenGetter?: () => string | null;

    constructor(opts: RealtimeOptions) {
        const u = new URL(opts.api);
        // 默认查询参数（例如 workspace_id）
        if (opts.defaultQuery) {
            Object.entries(opts.defaultQuery).forEach(([k, v]) => u.searchParams.set(k, v));
        }
        // 如果需要 query token 兜底
        this.tokenGetter = opts.tokenGetter;
        if (opts.allowQueryTokenFallback && this.tokenGetter) {
            const t = this.tokenGetter();
            if (t) u.searchParams.set('token', t);
        }
        this.url = u.toString().replace(/^http/, 'ws');

        this.reconnectionEnabled = opts.reconnection?.enabled ?? true;
        this.maxBackoff = opts.reconnection?.maxDelayMs ?? 10_000;
        this.shouldReconnect = this.reconnectionEnabled;
    }

    /** 公开：建立连接（如已连接则复用） */
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        try {
            this.ws = new WebSocket(this.url);
        } catch (e) {
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            // 恢复订阅
            if (this.subs.size) this.send({ type: 'subscribe', rooms: [...this.subs] });
            // 发送积压消息
            this.flushQueue();
            // 开心跳（20s）
            this.startPing();
            // 重置回退
            this.backoff = 500;
        };

        this.ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data) as Incoming;
                this.listeners.forEach((fn) => fn(msg));
            } catch {
                // ignore
            }
        };

        this.ws.onclose = () => {
            this.stopPing();
            if (this.reconnectionEnabled) this.scheduleReconnect();
        };

        this.ws.onerror = () => {
            // 出错也走重连
            try { this.ws?.close(); } catch { }
        };
    }

    /** 公开：关闭连接（不再重连） */
    close() {
        this.shouldReconnect = false as any; // trick: 防止再重连
        this.stopPing();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
    }

    /** 公开：订阅房间（会自动恢复） */
    subscribe(room: string) {
        if (!this.subs.has(room)) {
            this.subs.add(room);
            this.send({ type: 'subscribe', rooms: [room] });
        }
    }

    /** 公开：退订房间 */
    unsubscribe(room: string) {
        if (this.subs.delete(room)) {
            this.send({ type: 'unsubscribe', rooms: [room] });
        }
    }

    /** 公开：presence 专用辅助 */
    focusTask(projectId: string, taskId: string) {
        // 订阅任务事件房间（只收该任务的评论等事件）
        const room = roomTask(taskId);
        if (!this.subs.has(room)) {
            this.subs.add(room);
            this.send({ type: 'subscribe', rooms: [room] });
        }
        // 通知服务端 presence & 记录活跃任务（由服务端持久化）
        this.send({ type: 'focus_task', project_id: projectId, task_id: taskId });
    }

    blurTask(projectId: string, taskId: string) {
        const room = roomTask(taskId);
        if (this.subs.delete(room)) {
            this.send({ type: 'unsubscribe', rooms: [room] });
        }
        this.send({ type: 'blur_task', project_id: projectId, task_id: taskId });
    }

    /** 公开: 新增/删除评论 */
    addComment(projectId: string, taskId: string, commentId: string) {
        this.send({ type: 'add_comment', project_id: projectId, task_id: taskId, comment_id: commentId });
    }
    removeComment(projectId: string, taskId: string, commentId: string) {
        this.send({ type: 'remove_comment', project_id: projectId, task_id: taskId, comment_id: commentId });
    }

    /** 公开：注册/注销监听器 */
    on(fn: Listener) { this.listeners.add(fn); }
    off(fn: Listener) { this.listeners.delete(fn); }

    /** 内部：发送（若未 OPEN 则入队） */
    private send(msg: Outgoing) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            this.queue.push(msg);
            this.connect();
        }
    }

    private flushQueue() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        while (this.queue.length) {
            const m = this.queue.shift()!;
            this.ws.send(JSON.stringify(m));
        }
    }

    private startPing() {
        if (this.pingTimer) return;
        this.pingTimer = window.setInterval(() => {
            this.send({ type: 'ping' });
        }, 20_000);
    }
    private stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    private scheduleReconnect() {
        if (!this.reconnectionEnabled || !this.shouldReconnect) return;
        if (this.reconnectTimer) return;
        const delay = Math.min(this.backoff, this.maxBackoff);
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
            this.backoff = Math.min(this.backoff * 2, this.maxBackoff);
        }, delay);
    }

    reopen() {
        this.shouldReconnect = true;
        this.connect();
    }
}

// —— 单例工厂（懒加载） —— //
// 你也可以在 src/provider.tsx 里创建并注入，这里给一个简单单例
let _instance: RealtimeConnection | null = null;

export function getRealtime(opts: RealtimeOptions) {
    if (!_instance) {
        _instance = new RealtimeConnection(opts);
        _instance.connect();
    }
    return _instance;
}

export { roomProject, roomTask } from './protocol';
export type { Incoming, OnlineMap, Outgoing } from './protocol';