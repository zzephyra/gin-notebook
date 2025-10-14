export type SyncConflictPolicy = "latest"
export type SyncMode = "manual" | "auto"
export type SyncDirection = "push" | "pull" | "both"
export interface SyncPolicy {
    id: string;
    member_id: string;
    note_id: string;
    provider: string;
    target_note_id: string | null;
    target_note_url: string | null;
    direction: "push" | "pull" | "both";
    mode: "auto" | "manual";
    conflict_policy: "latest" | "server" | "client" | string;
    res_type: string;
    is_active: boolean;
    last_status: "idle" | "syncing" | "error" | string;
    last_error: string | null;
    last_synced_at: string | null;
    created_at: string;
    updated_at: string;
    status: "success" | "creating" | "error";
    [key: string]: any;
}