import { feishuCallbackApi } from "@/features/api/routes";
import { BASE_URL } from "@/lib/api/client";

// utils/feishuAuth.ts
export function openFeishuAuthPopup(appId: string, fromProvider: string) {
    const state = crypto.getRandomValues(new Uint32Array(4)).join("-");
    sessionStorage.setItem("feishu_oauth_state", state);

    const redirectUri = encodeURIComponent(BASE_URL + feishuCallbackApi);
    const url =
        `https://open.feishu.cn/open-apis/authen/v1/index` +
        `?app_id=${appId}` +
        `&redirect_uri=${redirectUri}` +
        `&state=${encodeURIComponent(state)}`;

    const w = 520, h = 680;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(url, "feishu_oauth", `width=${w},height=${h},left=${left},top=${top}`);

    // ✅ 只监听 postMessage，不检测关闭
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const timeout = setTimeout(() => {
            window.removeEventListener("message", onMsg);
            resolve({ ok: false, error: "授权超时" });
        }, 60000); // 1 分钟超时

        function onMsg(e: MessageEvent) {
            console.log("feishu auth msg", e);
            if (typeof e.data !== "object") return;
            const { provider, ok, error } = e.data || {};
            if (provider !== fromProvider) return;

            clearTimeout(timeout);
            window.removeEventListener("message", onMsg);
            popup?.close();
            resolve({ ok, error });
        }

        window.addEventListener("message", onMsg);
    });
}