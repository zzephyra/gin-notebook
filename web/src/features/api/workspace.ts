import { workspacesApi, workspacesLinkApi, workspacesListApi } from "@/features/api/routes";
import axiosClient from "@/lib/api/client";
import { responseCode } from "../constant/response";
import { ApiResponse } from "./type";
import { WorkspaceItem } from "@/store/features/workspace";



export async function CreateWorkspace(data: { [k: string]: FormDataEntryValue; }): Promise<ApiResponse<any>> {
    try {
        const res = await axiosClient.post(workspacesApi, data)
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Create workspace failed"
        }
    }
}

export async function getWorkspaceListRequest() {
    try {
        const res = await axiosClient.get(workspacesListApi, {})
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Get workspace failed"
        }
    }
}

interface SearchWorkspaceParams {
    workspace_id: any;
}

export async function GetWorkspace(params: SearchWorkspaceParams): Promise<ApiResponse<WorkspaceItem>> {
    try {
        const res = await axiosClient.get(workspacesApi, { params: params })
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Get workspace failed"
        }
    }
}


export async function updateWorkspaceRequest(workspace_id: string, data: Object) {
    try {
        const res = await axiosClient.post(`${workspacesApi}/${workspace_id}`, data)
        if (res.data.code == responseCode.SUCCESS) {
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export async function getWorkspaceInviteLinksListRequest(workspace_id: string) {
    try {
        const res = await axiosClient.get(`${workspacesApi}/${workspace_id}/links`, {})
        if (res.data.code == responseCode.SUCCESS) {
            return res.data.data
        }
        return []
    } catch (err) {
        return []
    }
}

export async function deleteWorkspaceInviteLinkRequest(workspace_id: string, link_id: string) {
    try {
        const res = await axiosClient.delete(`${workspacesApi}/link/${link_id}`, { params: { workspace: workspace_id } })
        if (res.data.code == responseCode.SUCCESS) {
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export async function createWorkspaceInviteLinkRequest(data: Object) {
    try {
        const res = await axiosClient.post(workspacesLinkApi, data)
        if (res.data.code == responseCode.SUCCESS) {
            return res.data.data
        } return null
    } catch (err) {
        return null
    }
}