import axiosClient from "@/lib/api/client";
import { workspaceNotesApi, workspaceNoteCategoryApi, workspaceNoteDeleteApi, workspaceCategoryRecommandApi, favoriteNoteApi } from "./routes";
import { i18n } from "@lingui/core";
import { responseCode } from "../constant/response";
import { store } from "@/store";
import { InsertNewCategory, UpdateNoteByID, DeleteNoteByID, setSelectedNoteId, UpdateNoteList } from "@/store/features/workspace";
import toast from "react-hot-toast";
import { FavoriteNoteListParams, WorkspaceNoteCreateParams } from "./type";
import { Note } from "@/pages/workspace/type";

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
        store.dispatch(UpdateNoteList(res.data.data.notes || []))
    }
    return res.data;
}


export async function GetNoteCategory(workspaceId: any, kw: string) {
    if (!workspaceId) {
        return { code: 500, error: i18n._("Missing valid value") };
    }
    let res = await axiosClient.get(workspaceNoteCategoryApi, { params: { workspace_id: workspaceId, kw } });
    if (res.data.code == responseCode.SUCCESS) {
        return res.data.data || [];
    }
    return [];
}

export async function AutoUpdateContent(data: { content: string, workspace_id: string, note_id: string }) {
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

export async function UpdateNote(workspace_id: string, note_id: string, data: Object) {
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

export async function UpdateCategory(workspace_id: any, category_id: any, data: Object) {
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

export async function CreateCategory(data: { category_name: any, workspace_id: any }) {
    try {
        const res = await axiosClient.post(workspaceNoteCategoryApi, data)
        if (res.data.code == responseCode.SUCCESS) {
            store.dispatch(InsertNewCategory({ ...res.data.data, total: 0 }))
        } else {
            toast.error(i18n._("Add new note failed"))
        }
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Update note failed"
        }
    }
}

export async function CreateNote(data: WorkspaceNoteCreateParams) {
    try {
        const res = await axiosClient.post(workspaceNotesApi, data)
        if (res.data.code == responseCode.SUCCESS) {
            store.dispatch(UpdateNoteByID(res.data.data))
        } else {
            toast.error(i18n._("Add new category failed"))
        }
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Update note failed"
        }
    }
}

export async function DeleteNote(workspace_id: string, note_id: string) {
    try {
        const res = await axiosClient.post(workspaceNoteDeleteApi, { workspace_id, note_id })
        if (res.data.code == responseCode.SUCCESS) {
            var state = store.getState();
            if (state.workspace.selectedNoteId == note_id) {
                store.dispatch(setSelectedNoteId(null));
            }
            store.dispatch(DeleteNoteByID(note_id))
        } else {
            toast.error(i18n._("Delete note failed"))
        }
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Update note failed"
        }
    }
}

export async function GetRecommandCategories(workspace_id: string) {
    var defaultResponse = {
        hot: [],
        recent: []
    }
    try {
        const res = await axiosClient.get(workspaceCategoryRecommandApi, { params: { workspace_id } })
        if (res.data.code != responseCode.SUCCESS) {
            return defaultResponse
        }
        return res.data.data
    } catch (err) {
        return defaultResponse
    }
}


export async function SetFavoriteNoeRequest(note_id: string, is_favorite: boolean) {
    try {
        const res = await axiosClient.post(favoriteNoteApi, { note_id, is_favorite, sep: Date.now() })
        if (res.data.code == responseCode.SUCCESS) {
            return true
        } else {
            return false
        }
    } catch (err) {
        return false
    }
}

export async function GetFavoriteNoteListRequest(params: FavoriteNoteListParams): Promise<Note[]> {
    if (!params.workspace_id) {
        return []
    }

    if (!params.offset || params.offset < 0) {
        params.offset = 0;
    }

    if (!params.limit || params.limit < 0 || params.limit > 30) {
        params.limit = 10;
    }

    try {
        var res = await axiosClient.get(favoriteNoteApi, { params })
        return res.data.data || []
    } catch (e) {
        return []
    }
}