import axiosClient from "@/lib/api/client";
import { workspaceNotesApi, workspaceNoteCategoryApi } from "./routes";
import { i18n } from "@lingui/core";
import { responseCode } from "../constant/response";
import { store } from "@/store";
import { UpdateNoteCategoryList, UpdateNoteList } from "@/store/features/workspace";

export async function GetNoteList(workspaceId: any, offset: number, limit: number) {
    if (!workspaceId) {
        return { code: 500, error: i18n._("Missing valid value") };
    }

    if (!offset || offset < 0) {
        offset = 0;
    }

    if (!limit || limit < 0) {
        limit = 10;
    }

    let res = await axiosClient.get(workspaceNotesApi, { params: { workspace_id: workspaceId, offset, limit } });
    if (res.data.code == responseCode.SUCCESS) {
        console.log(res.data.data)
        store.dispatch(UpdateNoteList(res.data.data.notes))
    }
    return res.data;
}


export async function GetNoteCategory(workspaceId: any) {
    if (!workspaceId) {
        return { code: 500, error: i18n._("Missing valid value") };
    }
    let res = await axiosClient.get(workspaceNoteCategoryApi, { params: { workspace_id: workspaceId } });
    if (res.data.code == responseCode.SUCCESS) {
        store.dispatch(UpdateNoteCategoryList(res.data.data))
    }
    return res.data;
}

export async function AutoUpdateContent(data: { content: string, workspace_id: number, note_id: number }) {
    try {
        const res = await axiosClient.put(workspaceNotesApi, data)
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Auto update content failed"
        }
    }
}

export async function UpdateNote(workspace_id: number, note_id: number, data: Object) {
    try {
        const res = await axiosClient.put(workspaceNotesApi, { workspace_id, note_id, ...data })
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Update note failed"
        }
    }

}

export async function UpdateCategory(workspace_id: number, category_id: number, data: Object) {
    try {
        const res = await axiosClient.put(workspaceNoteCategoryApi, { workspace_id, id: category_id, ...data })
        
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Update note failed"
        }
    }
}