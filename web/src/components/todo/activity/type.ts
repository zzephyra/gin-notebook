import { UserBrief } from "@/types/user";

export type TaskActivity = {
    id: string;
    task_id: string;
    member: UserBrief;
    action: string;
    summary_key: string;
    summary_params: any;
    summary_fallback: string;
    created_at: string;
    [key: string]: any;
}

export type TaskActivityProps = {
    activities: TaskActivity[];
}