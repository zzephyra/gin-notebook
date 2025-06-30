import { Event } from '@/types/event';
import { RRule } from 'rrule';

// 获取当天的起止时间
export function getDayRange(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

// 判断事件是否出现在当天
export function isEventOnDate(event: Event, targetDate: Date): boolean {
    const { startOfDay, endOfDay } = getDayRange(targetDate);

    if (event.rrule) {
        const rule = RRule.fromString(event.rrule);
        const dayBefore = new Date(startOfDay);
        dayBefore.setDate(dayBefore.getDate() - 1);

        const occurrences = rule.between(dayBefore, endOfDay, true);

        for (const occ of occurrences) {
            const occStart = occ;
            const occEnd = new Date(occ);

            if (event.duration) {
                occEnd.setHours(occEnd.getHours() + event.duration.hours);
                occEnd.setMinutes(occEnd.getMinutes() + event.duration.minutes);
            }

            if (occStart <= endOfDay && occEnd >= startOfDay) return true;
        }

        return false;
    }

    if (event.start) {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : start;
        return start <= endOfDay && end >= startOfDay;
    }

    return false;
}

// 获取事件在当日的显示起点（用于排序）
export function getDisplayTime(event: Event, targetDate: Date): Date {
    const { startOfDay, endOfDay } = getDayRange(targetDate);

    if (event.rrule) {
        const rule = RRule.fromString(event.rrule);
        const dayBefore = new Date(startOfDay);
        dayBefore.setDate(dayBefore.getDate() - 1);

        const occurrences = rule.between(dayBefore, endOfDay, true);

        for (const occ of occurrences) {
            const occStart = occ;
            const occEnd = new Date(occ);
            if (event.duration) {
                occEnd.setHours(occEnd.getHours() + event.duration.hours);
                occEnd.setMinutes(occEnd.getMinutes() + event.duration.minutes);
            }
            if (occStart <= endOfDay && occEnd >= startOfDay) {
                return occStart;
            }
        }

        return new Date(8640000000000000); // 不应显示
    }

    if (event.start) {
        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : start;

        if (start <= endOfDay && end >= startOfDay) {
            return start;
        }
    }

    return new Date(8640000000000000); // 不应显示
}

// 对事件排序：allDay优先，时间早的优先
export function sortEvents(events: Event[], targetDate: Date): Event[] {
    return [...events].sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;

        const aTime = getDisplayTime(a, targetDate);
        const bTime = getDisplayTime(b, targetDate);
        return aTime.getTime() - bTime.getTime();
    });
}

export function getEventsForDate(events: Event[], targetDate: Date): Event[] {
    const filtered = events.filter(e => isEventOnDate(e, targetDate));
    return sortEvents(filtered, targetDate);
}