import axiosClient from "@/lib/api/client";
import { columnApiWithID, projectsApi, taskUpdateApi, todoTasksApi } from "./routes";
import { responseCode } from "../constant/response";
import { ColumnUpdatePayload, CreateTaskInput, TaskUpdatePayload, ToDoColumn } from "@/components/todo/type";
import toast from "react-hot-toast";
export async function getProjectsRequest(projectID: string, workspaceID: string): Promise<{ code: number, data: { todo: ToDoColumn[] } }> {
    if (!projectID || !workspaceID) {
        return {
            code: responseCode.ERROR,
            data: {
                todo: []
            }
        }
    }

    try {
        let res = await axiosClient.get(projectsApi + `/${projectID}`, { params: { workspace_id: workspaceID } })
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {
                todo: []
            }
        }
    }
}

export async function getProjectsListRequest(workspaceID: string) {
    try {
        let res = await axiosClient.get(projectsApi, { params: { workspace_id: workspaceID } })
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }
}

export async function createTaskRequest(input: CreateTaskInput) {
    let res = await axiosClient.post(todoTasksApi, input, {
        headers: { 'Idempotency-Key': input.client_temp_id },
    })
    return res.data.data || {};
}

export async function updateTaskRequest(taskID: string, workspace_id: string, column_id: string, project_id: string, updated_at: string, payload: Partial<TaskUpdatePayload>) {
    if (!taskID || !workspace_id || !column_id || !project_id || !updated_at) {
        return {};
    }

    const try_times = 3;

    for (let i = 0; i < try_times; i++) {
        try {
            let res = await axiosClient.put(taskUpdateApi(taskID), { workspace_id, column_id, project_id, updated_at, payload }, { suppressToast: i < try_times - 1 });
            if (res.data.code === responseCode.SUCCESS) {
                return res.data || {};
            }

            if (res.data.code != responseCode.ERROR_TASK_UPDATE_CONFLICTED) {
                return res.data || {};
            }

            updated_at = res.data.data?.updated_at;

            if (updated_at === undefined || updated_at === "") {
                return {};
            }
        } catch (err) {
            continue;
        }
    }

    return {};
}

export async function cleanColumnTasksRequest(columnID: string, workspace_id: string, project_id: string) {
    if (!columnID || !workspace_id || !project_id) {
        toast.error("Missing required parameters to clean tasks.");
        return {};
    }

    try {
        let res = await axiosClient.delete(columnApiWithID(columnID), { data: { workspace_id, project_id } })
        return res.data || {};
    } catch (err) {
        return {};
    }
}

export async function updateProjectColumnRequest(column_id: string, workspace_id: string, updated_at: string, project_id: string, payload: Partial<ColumnUpdatePayload>) {
    // if (!column_id || !workspace_id || !project_id || !updated_at) {
    //     toast.error("Missing required parameters to update column.");
    //     return {};
    // }

    const try_times = 3;

    for (let i = 0; i < try_times; i++) {
        try {
            let res = await axiosClient.put(columnApiWithID(column_id), { workspace_id, column_id, project_id, updated_at, payload }, { suppressToast: i < try_times - 1 });
            if (res.data.code === responseCode.SUCCESS) {
                return res.data.data || {};
            }

            if (res.data.code != responseCode.ERROR_PROJECT_COLUMN_UPDATE_CONFLICTED) {
                return {};
            }

            updated_at = res.data.data?.updated_at;

            if (updated_at === undefined || updated_at === "") {
                return {};
            }
        } catch (err) {
            continue;
        }
    }
}