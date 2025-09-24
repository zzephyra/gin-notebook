import axiosClient from "@/lib/api/client";
import { projectSettingsApi, settingsApi, systemSettingsApi } from "./routes";
import { store } from "@/store";
import { setSettings } from "@/store/features/settings";
import { ProjectSettingsPayload } from "./type";
import { responseCode } from "../constant/response";

interface SettingsParams {
    category: string | null | undefined;
    filter: string | null | undefined;
}

export async function getSettingsRequest(params: Partial<SettingsParams>) {
    let response = await axiosClient.get(settingsApi, { params })
    if (response.data.code === 200) {
        store.dispatch(setSettings({ ...response.data.data }))
        return response.data.data;
    } else {
        throw new Error("Failed to fetch settings");
    }
}

export async function updateSystemSettingsRequest(data: object) {
    let response = await axiosClient.post(systemSettingsApi, data)
    if (response.data.code === responseCode.SUCCESS) {
        store.dispatch(setSettings({ system: data }))
        return response.data;
    } else {
        return {}
    }
}

export async function updateProjectSettingsRequest(projectID: string, workspace_id: string, updated_at: string, payload: ProjectSettingsPayload) {
    let response = await axiosClient.put(projectSettingsApi(projectID), { workspace_id, updated_at, payload })
    if (response.data.code === responseCode.SUCCESS) {
        return response.data.data;
    } else {
        return {}
    }
}