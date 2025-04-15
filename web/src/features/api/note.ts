import axiosClient from "@/lib/api/client";
import { workspaceNotesApi, workspaceNoteCategoryApi } from "./routes";
import { i18n } from "@lingui/core";



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
    return res.data;
}


export async function GetNoteCategory(workspaceId: any) {
    if (!workspaceId) {
        return { code: 500, error: i18n._("Missing valid value") };
    }
    let res = await axiosClient.get(workspaceNoteCategoryApi, { params: { workspace_id: workspaceId } });
    return res.data;
}