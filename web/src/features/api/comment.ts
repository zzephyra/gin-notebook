import axiosClient from "@/lib/api/client";
import { taskCommentAttachmentApi, taskCommentLikeApi, taskCommentsApi, taskCommentWithIDApi } from "./routes";
import { TaskCommentData, TaskCommentEditableData, TaskCommentParams } from "./type";
import { responseCode } from "../constant/response";
import { CommentAttachment } from "@/components/comment/main/type";

export async function createTaskCommentRequest(data: TaskCommentData) {
    let res = await axiosClient.post(taskCommentsApi(data.task_id), data);
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
        let res = await axiosClient.get(taskCommentsApi(data.task_id), { params: data })
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
        let res = await axiosClient.delete(taskCommentWithIDApi(taskID, commentID), { data: { workspace_id: workspaceID } })
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: []
        }
    }
}

export async function updateCommentRequest(workspaceID: string, taskID: string, commentID: string, data: Partial<TaskCommentEditableData>) {
    if (!taskID || !commentID) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }

    try {
        let res = await axiosClient.put(taskCommentWithIDApi(taskID, commentID), { workspace_id: workspaceID, ...data });
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }
}

export async function createAttachmentRequest(taskID: string, commentID: string, attachment: CommentAttachment) {
    try {
        let res = await axiosClient.post(taskCommentAttachmentApi(taskID, commentID), attachment);
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }
}

export async function createOrUpdateCommentLikeRequest(taskID: string, commentID: string, workspace_id: string, like: boolean) {
    try {
        let res = await axiosClient.post(taskCommentLikeApi(taskID, commentID), { workspace_id, like });
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }
}

export async function deleteCommentLikeRequest(taskID: string, commentID: string, workspace_id: string) {
    try {
        let res = await axiosClient.delete(taskCommentLikeApi(taskID, commentID), { data: { workspace_id } });
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            data: {}
        }
    }
}