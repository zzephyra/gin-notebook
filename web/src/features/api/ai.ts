import axiosClient from "@/lib/api/client";
import { aiChatApi } from "./routes";
import { Message } from "@douyinfe/semi-ui/lib/es/chat/interface";

type AIChatApiProps = {
    isSearchInternet?: boolean;
}

export async function getAIChatApi(messages: Message[], controller?: AbortController, props?: AIChatApiProps): Promise<any> {
    try {
        if (!messages || messages.length === 0) {
            throw new Error("Messages cannot be empty");
        }
        const res = await axiosClient(aiChatApi,
            {
                method: "POST",
                data: { ...props, messages },
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
        return;
    }
}