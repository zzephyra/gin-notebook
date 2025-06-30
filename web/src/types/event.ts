export type Event = {
    id?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    title?: string;
    color?: string;
    rrule?: string;
    rrule_type?: string; // 0: No Repeat, 1: Daily, 2: Weekly, 3: Monthly, 4: Yearly
    duration?: {
        hours: number;
        minutes: number;
    }
}
