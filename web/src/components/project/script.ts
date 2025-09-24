export type ProjectItem = {
    id: string;
    name: string;
    description?: string;
    status?: string;
    workspace_id?: string;
    process_id?: string;
    [key: string]: any;
}