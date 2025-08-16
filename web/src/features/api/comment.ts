import axiosClient from "@/lib/api/client";
import { TaskCommentsApi, TaskCommentWithIDApi } from "./routes";
import { TaskCommentData, TaskCommentEditableData, TaskCommentParams } from "./type";
import { responseCode } from "../constant/response";

export async function createTaskCommentRequest(data: TaskCommentData) {
    let res = await axiosClient.post(TaskCommentsApi(data.task_id), data);
    return res.data;
}

export async function getTasksCommentRequest(data: TaskCommentParams) {
    if (!data.workspace_id || !data.task_id) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }

    try {
        let res = await axiosClient.get(TaskCommentsApi(data.task_id), { params: data })
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }
}

export async function deleteTasksCommentRequest(taskID: string, commentID: string, workspaceID: string) {
    if (!workspaceID || !taskID || !commentID) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }

    try {
        let res = await axiosClient.delete(TaskCommentWithIDApi(taskID, commentID), { data: { workspace_id: workspaceID } })
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }
}

export async function updateCommentRequest(taskID: string, commentID: string, data: Partial<TaskCommentEditableData>) {
    if (!taskID || !commentID) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }

    try {
        let res = await axiosClient.patch(TaskCommentsApi(taskID), { comment_id: commentID, ...data });
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }
}