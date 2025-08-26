import axiosClient from "@/lib/api/client";
import { projectsApi, taskUpdateApi, todoTasksApi } from "./routes";
import { responseCode } from "../constant/response";
import { CreateTaskInput, TaskUpdatePayload, ToDoColumn } from "@/components/todo/type";
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

export async function updateTaskRequest(taskID: string, workspace_id: string, column_id: string, project_id: string, payload: Partial<TaskUpdatePayload>) {
    if (!taskID || !workspace_id || !column_id || !project_id) {
        return {};
    }
    let res = await axiosClient.put(taskUpdateApi(taskID), { workspace_id, column_id, project_id, payload })
    return res.data.data || {};
}