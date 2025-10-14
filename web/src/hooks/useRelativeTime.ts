// hooks/useRelativeTime.ts
import { useEffect, useMemo, useState } from "react";
import type { I18n } from "@lingui/core";
import { formatRelativeTime } from "@/utils/timeAgo";

function nextUpdateInMs(from: Date, now: Date): number | null {
    const ms = now.getTime() - from.getTime();
    if (ms < 0) return 1000;
    const s = Math.floor(ms / 1000);
    if (s < 60) return 1000;
    const m = Math.floor(s / 60);
    if (m < 60) return (60 - (s % 60)) * 1000;
    const h = Math.floor(m / 60);
    if (h < 24) return (3600 - (s % 3600)) * 1000;
    const d = Math.floor(h / 24);
    if (d < 30) return (86400 - (s % 86400)) * 1000;
    return null;
}

export function useRelativeTime(
    input: string | number | Date | null | undefined,
    i18n: I18n
): string {
    const date = useMemo(() => {
        if (!input) return null;
        return input instanceof Date ? input : new Date(input);
    }, [input]);

    const [now, setNow] = useState<Date>(new Date());

    const text = useMemo(() => {
        if (!date) return "";
        return formatRelativeTime(date, i18n, now);
    }, [date, i18n, now]);

    useEffect(() => {
        if (!date) return; // 没有日期就不安排刷新，但这个 useEffect 仍然被“调用”
        const schedule = () => {
            const wait = nextUpdateInMs(date, new Date());
            if (wait == null) return;
            const id = setTimeout(() => {
                setNow(new Date());
                schedule();
            }, wait);
            return () => clearTimeout(id);
        };
        const cleanup = schedule();
        return cleanup;
    }, [date, i18n]);

    return text;
}
