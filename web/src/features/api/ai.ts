import axiosClient from "@/lib/api/client";
import { aiChatApi, aiChatMessageApi, aiChatHistoryApi, aiChatSessionApi } from "./routes";
import { Message } from "@douyinfe/semi-ui/lib/es/chat/interface";
import toast from "react-hot-toast";
import { i18n } from "@lingui/core";
import { UpdateSession } from "./type";

type AIChatApiProps = {
    isSearchInternet?: boolean;
    session_id?: string;
}

export async function getAIChatApi(messages: Message[], workspace_id: string, controller?: AbortController, props?: AIChatApiProps): Promise<any> {
    try {
        if (!messages || messages.length === 0) {
            throw new Error("Messages cannot be empty");
        }
        const res = await axiosClient(aiChatApi,
            {
                method: "POST",
                data: { ...props, workspace_id, messages },
                responseType: 'stream',
                adapter: "fetch",
                timeout: 0,
                headers: {
                    Accept: "text/event-stream",
                    "Content-Type": "application/json",
                },
                signal: controller ? controller.signal : undefined,
            }
        );
        return res
    } catch (err) {
        console.error("Error in getAIChatApi:", err);
        return;
    }
}

export async function createAIMessage(content: string, action: "insert" | "init", status: string, role: string, workspace_id: string, session_id?: string, parentID?: string, title?: string,) {
    try {
        if (action == "insert" && session_id == undefined) {
            console.error("Session ID is required for insert action");
            return
        }
        const res = await axiosClient.post(aiChatMessageApi, {
            content,
            action,
            workspace_id,
            status,
            role,
            session_id,
            parentID,
            title
        });
        return res.data;
    } catch (err) {
        return {
            code: 500,
            error: "Create AI message failed"
        };
    }
}

export async function updateAIMessage(content: string, action: "reset", status: string, role: string, message_id: string | undefined, workspace_id: string, session_id?: string) {
    try {
        if (message_id == undefined || message_id == "") {
            toast.error(i18n._("Message ID is required for update action"));
            return
        }
        const res = await axiosClient.put(`${aiChatMessageApi}/${message_id}`, {
            content,
            action,
            workspace_id,
            status,
            role,
            session_id
        });
        return res.data;
    } catch (err) {
        return {
            code: 500,
            error: "Create AI message failed"
        };
    }
}


export async function getAIHistorySessionsRequest(workspace_id: string, offset: number = 0) {
    try {
        const res = await axiosClient.get(aiChatHistoryApi, { params: { offset, workspace_id } });
        return res.data?.data || {};
    } catch (err) {
        return {};
    }
}

export async function deleteAIHistorySessionRequest(session_id: string, workspace_id: string) {
    try {
        const res = await axiosClient.delete(`${aiChatSessionApi}/${session_id}`, { data: { session_id, workspace_id } });
        return res.data;
    } catch (err) {
        return {
            code: 500,
            error: "Delete AI history session failed"
        };
    }
}

export async function updateAIHistorySessionRequest(session_id: string, workspace_id: string, data: UpdateSession) {
    try {
        let res = await axiosClient.put(`${aiChatSessionApi}/${session_id}`, { ...data, workspace_id });
        return res.data;
    } catch (err) {
        return {
            code: 500,
            error: "Update AI history session failed"
        };
    }
}

export async function getAIChatSessionRequest(session_id: string, workspace_id: string) {
    try {
        const res = await axiosClient.get(`${aiChatSessionApi}/${session_id}`, { params: { workspace_id } });
        return res.data;
    } catch (err) {
        toast.error(i18n._("Failed to fetch AI chat session"));
        return {};
    }
}