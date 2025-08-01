import axiosClient from "@/lib/api/client";
import { projectsApi, todoTasksApi } from "./routes";
import { responseCode } from "../constant/response";
import { CreateTaskInput, ToDoColumn } from "@/components/todo/type";
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