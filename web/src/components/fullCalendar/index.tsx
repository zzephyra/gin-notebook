import FullCalendar from '@fullcalendar/react'
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from "@fullcalendar/interaction"
import { useDisclosure, Button } from '@heroui/react'
import { DateSelectArg } from '@fullcalendar/core/index.js'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type FullCalendarClass from '@fullcalendar/react';
import { useLingui } from '@lingui/react/macro'
import { addDays, format, subDays } from "date-fns";
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import AddNewEventModal from '../modal/event/add';
import { CreateEventRequest, UpdateEventRequest } from '@/features/api/event';
import { Event } from '@/types/event';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { responseCode } from '@/features/constant/response';

function createRecurringEventFromStartEnd(
    start: Date,
    end: Date,
) {
    const durationMs = end.getTime() - start.getTime(); // 毫秒差
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    const duration = {
        hours: hours,
        minutes: minutes,
    }
    return duration;
}

type ChildProps = { events: Event[], date: Date | undefined, onChangeDate?: (date: Date) => void, onEventChange?: (event: any) => void };

export type CalendarRef = {
    onOpen: () => void;
};

const Calendar = forwardRef<CalendarRef, ChildProps>((props, ref) => {
    const calendarRef = useRef<FullCalendarClass | null>(null);
    const params = useParams();
    const { t } = useLingui();
    const [pendingEvent, setPendingEvent] = useState<Event | undefined>();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();


    useImperativeHandle(ref, () => ({
        onOpen
    }));
    const handleSelect = (args: DateSelectArg) => {
        args.view.calendar.unselect(); // 清除选择状态
        // 在这里可以处理日期范围选择事件，例如打开一个模态框或执行其他操作
        onOpen();
        setPendingEvent({
            start: args.start,
            end: args.end,
            allDay: args.allDay,
            title: "",
            color: "#3788d8" // 默认颜色
        });
    }



    const handleDateChange = (action: "add" | "sub") => {
        var newDate = props.date || new Date();
        if (action === "add") {
            newDate = addDays(newDate, 7);
        } else {
            newDate = subDays(newDate, 7);
        }

        if (props.onChangeDate) {
            props.onChangeDate(newDate);
        }
    }

    const handleTimeChange = (type: "start" | "end", date: Date) => {
        if (pendingEvent) {
            if (type === "start") {
                setPendingEvent((prev: any) => ({ ...prev, start: date }));
            } else {
                setPendingEvent((prev: any) => ({ ...prev, end: date }));
            }
        }
    }

    const handleUpdateEvent = (field: string, value: any, subfield?: string) => {
        const update = {
            ...pendingEvent,
            [field]: subfield
                ? {
                    ...(pendingEvent as any)[field],
                    [subfield]: value
                }
                : value
        };

        if (field == "rrule") {
            // 如果清空了重复规则，则删除 rrule 字段
            if (value == "") {
                delete update.rrule
                delete update.duration
            } else {
                // 如果有重复规则，则生成持续时间
                if (update.start && update.end) {
                    update.duration = createRecurringEventFromStartEnd(update.start, update.end);
                }
            }
        }

        if (pendingEvent) {
            setPendingEvent(update);
        }
    }

    const handleOpenChange = () => {
        onOpenChange();
        setPendingEvent(undefined);
    }

    const handleCreateEvent = async () => {
        if (!pendingEvent) return;
        let res = await CreateEventRequest(params?.id || "", pendingEvent)
        if (res?.data) {
            toast.success(t`Create event successfully`);
            if (props.onEventChange) props.onEventChange({ ...pendingEvent, id: res.data.id })
            handleOpenChange();
        }
    }

    const handleUpdateEventById = async (id: string, event: Partial<Event>) => {
        if (!id || !event) return;
        let oldEvent = props.events.find(e => e.id === id);
        console.log("oldEvent", props.events, id);
        if (!oldEvent) {
            toast.error(t`Event not found`);
            return;
        }

        let res = await UpdateEventRequest(params.id || "", id, event)
        if (res.code != responseCode.SUCCESS) {
            toast.error(t`Update event failed`);

        }
    }

    const handleEventChange = async (event: any) => {
        handleUpdateEventById(event.event.id, {
            start: event.event.start,
            end: event.event.end,
        });
    }

    useEffect(() => {
        if (props.date) {
            calendarRef.current?.getApi().changeView("sevenDay", props.date);
        }
    }, [props.date]);

    return (
        <div className="h-full w-full flex-1 flex flex-col">
            <AddNewEventModal onCreate={handleCreateEvent} onTimeChange={handleTimeChange} event={pendingEvent} isOpen={isOpen} onOpenChange={handleOpenChange} onUpdateEvent={handleUpdateEvent}>
            </AddNewEventModal>
            {/* <Drawer isOpen={isOpen} onOpenChange={onOpenChange} >
                <DrawerContent>
                    <DrawerHeader>
                        <h1>
                            {t`Create Event`}
                        </h1>
                    </DrawerHeader>
                    <DrawerBody>
                        <Form>
                            <Input size='sm' labelPlacement="outside" name='event_name' placeholder={t`Event Name`} label={t`Event Name`}></Input>
                        </Form>
                    </DrawerBody>
                </DrawerContent>
            </Drawer> */}
            <div className='mb-2'>
                <div className='font-medium text-xl flex gap-2 items-center'>
                    {
                        format(props.date || new Date(), "MM yyyy")
                    }
                    <div className='flex gap-1'>
                        <Button isIconOnly className='rounded min-w-0 w-6 h-6' onPress={() => handleDateChange("sub")}>
                            <ArrowLeftIcon className='w-4 h-4' />
                        </Button>
                        <Button isIconOnly className='rounded min-w-0 w-6 h-6' onPress={() => handleDateChange("add")}>
                            <ArrowRightIcon className='w-4 h-4' />
                        </Button>
                    </div>
                </div>
            </div>
            <div className='flex-1'>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin, rrulePlugin]}
                    initialView="timeGridWeek"
                    height={"100%"}
                    headerToolbar={false}
                    events={props.events.concat(pendingEvent ? [pendingEvent] : [])}
                    views={{
                        sevenDay: {
                            type: "timeGrid",
                            duration: { days: 7 },    // ★ 7 天，不会自动对齐到周一
                            buttonText: "7 day"
                        }
                    }}
                    allDayClassNames={"text-slate-500 font-normal text-xs"}
                    slotLabelClassNames={"text-slate-500 font-normal text-xs"}
                    eventChange={handleEventChange}
                    dayHeaderClassNames={"text-slate-500 font-normal text-xs"}
                    slotDuration="00:30:00"
                    editable={true}
                    select={handleSelect}
                    selectable={true}
                    selectMirror={false}
                    nowIndicator={true} // 当前时间指示线
                    dayMaxEvents={true} // allow "more" link when too many events
                />
            </div>
        </div>
    )
})

export default Calendar;