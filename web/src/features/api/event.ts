import axiosClient from "@/lib/api/client";
import { eventApi } from "./routes";
import { Event } from "@/types/event";

export async function CreateEventRequest(workspace_id: string, event: Event) {
    if (!workspace_id || !event) return null;

    try {
        let res = await axiosClient.post(eventApi, { ...event, workspace_id });
        return res.data;
    } catch (error) {
        return null;
    }
}

export async function GetEventListRequest(params: { workspace_id: string, to: string, from: string, owner_id?: string }) {
    try {
        let res = await axiosClient.get(eventApi, { params });
        return res.data;
    } catch (error) {
        return {
            total: 0,
            events: [] as Event[]
        };
    }
}

export async function UpdateEventRequest(workspace_id: string, event_id: string, data: Partial<Event>) {
    if (!workspace_id || !event_id || !data) return null;
    try {
        let res = await axiosClient.put(`${eventApi}/${event_id}`, { ...data, workspace_id });
        return res.data;
    } catch (error) {
        return null;
    }
}