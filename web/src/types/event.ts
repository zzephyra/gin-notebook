export type Event = {
    id?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    title?: string;
    color?: string;
    rrule?: string;
    duration?: {
        hours: number;
        minutes: number;
    }
}
