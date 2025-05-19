import axiosClient from "@/lib/api/client";
import { settingsApi, systemSettingsApi } from "./routes";
import { store } from "@/store";
import { setSettings } from "@/store/features/settings";

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
    if (response.data.code === 200) {
        store.dispatch(setSettings({ system: data }))
        return response.data;
    } else {
        return {}
    }
}