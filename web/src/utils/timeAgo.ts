// utils/timeAgo.ts
import { I18n } from "@lingui/core";

/**
 * 将时间字符串/Date 转成相对时间文案（多语言）
 * 规则：
 * - < 1 分钟：显示“X 秒之前”
 * - < 1 小时：显示“X 分钟之前”
 * - < 1 天：显示“X 小时之前”
 * - < 30 天：显示“X 天之前”
 * - ≥ 30 天：固定显示“30 天以前”
 *
 * @param input 可被 new Date(...) 解析的时间或 Date
 * @param i18n  传入当前的 i18n 实例（来自 @lingui/core）
 * @param now   （可选）用于对比的当前时间，默认 new Date()
 */
export function formatRelativeTime(
    input: string | number | Date,
    i18n: I18n,
    now: Date = new Date()
): string {
    const date = input instanceof Date ? input : new Date(input);
    const ms = now.getTime() - date.getTime();

    // 非法日期或未来时间，统一按“刚刚”处理（你也可以改成“in X ...”的未来文案）
    if (Number.isNaN(date.getTime()) || ms <= 0) {
        return i18n._(`just now`);
    }

    const s = Math.floor(ms / 1000);
    if (s < 60) {
        return i18n._(
            `{count} seconds ago`,
            { count: s }
        );
    }

    const m = Math.floor(s / 60);

    if (m < 60) {
        return i18n._(
            `{count} minutes ago`,
            { count: m }
        );
    }

    const h = Math.floor(m / 60);
    if (h < 24) {
        return i18n._(
            "{count} hours ago",
            { count: h }
        );
    }

    const d = Math.floor(h / 24);
    if (d < 30) {
        return i18n._(
            "{count} days ago",
            { count: d }
        );
    }

    // ≥ 30 天：固定文案
    return i18n._(`30 days ago`);
}
