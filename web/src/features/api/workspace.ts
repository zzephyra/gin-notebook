import { workspacesApi, workspacesListApi } from "@/features/api/routes";
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

export async function GetWorkspaceList() {
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

