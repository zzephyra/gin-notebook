import Calendar, { CalendarRef } from "@/components/fullCalendar";
import { Card, CardBody, CardHeader, Divider, Form, Input, Popover, PopoverContent, PopoverTrigger, ScrollShadow, Select, SelectItem, SharedSelection } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import "react-day-picker/style.css";
import { CalendarIcon } from "@heroicons/react/24/solid";
import MameosDayPicker from "@/components/datePicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { GetEventListRequest, UpdateEventRequest } from "@/features/api/event";
import { useBlocker, useParams } from "react-router-dom";
import { addDays, format } from "date-fns";
import { Event } from "@/types/event";
import AvatarMenu from "@/components/avatarMenu";
import { useMediaQuery } from "react-responsive";
import { IconCalendarClock } from "@douyinfe/semi-icons";
import { Timeline } from '@douyinfe/semi-ui';
import { getEventsForDate } from "@/components/fullCalendar/script";
import { responseCode } from "@/features/constant/response";
import toast from "react-hot-toast";
import Swatch from '@uiw/react-color-swatch';
import { hsvaToHex } from '@uiw/color-convert';
import { preset } from "@/components/modal/event/add";
import { ArrowDownIcon, ArrowPathRoundedSquareIcon, ClockIcon, EyeDropperIcon } from "@heroicons/react/24/outline";
import { Calendar as DateCalendar, DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { createRecurringEventFromStartEnd, RruleTypes, updateNewRrule } from "@/utils/tools";

const EventForm = ({ event, onValueChange, popoverRef }: { event: Event, onValueChange: (value: any, field: string) => void, popoverRef?: any }) => {
    const { t, i18n } = useLingui();
    const handleValueChange = (value: any, field: string) => {
        onValueChange(value, field);
    }
    const weekdayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const today = new Date(event?.start || new Date());
    const byDay = weekdayMap[today.getDay()];  // 'WE'
    const day = today.getDate();     // 25

    const handleChangeSelection = (value: SharedSelection) => {
        handleValueChange(value.currentKey, "rrule_type")
        handleValueChange(RruleTypes(value.currentKey, new Date(event?.start || new Date())), "rrule")
        handleValueChange(createRecurringEventFromStartEnd(new Date(event?.start || new Date()), new Date(event?.end || new Date())), "duration");
    }

    const handleChangeDate = (date: DateObject | null, field: "end" | "start") => {
        if (!date) return;

        const newDate = date.toDate();
        const isStart = field === "start";
        const updateDate = isStart
            ? newDate > new Date(event?.end || new Date())
                ? [event.end, newDate]
                : [newDate, event.end]
            : newDate < new Date(event?.start || new Date())
                ? [newDate, event.start]
                : [event.start, newDate];
        handleValueChange(updateDate[0], "start");
        handleValueChange(updateDate[1], "end");
        // 处理 rrule（如果存在）  
        if (event.rrule && event.start && event.end) {
            handleValueChange(updateNewRrule(new Date(updateDate[0] || new Date()), event.rrule), "rrule");
            handleValueChange(createRecurringEventFromStartEnd(new Date(updateDate[0] || new Date()), new Date(updateDate[1] || new Date())), "duration");
        }
    };


    return (
        <Form>
            <Input
                size="sm"
                label={t`Event Title`}
                labelPlacement="outside"
                value={event?.title || ""}
                onValueChange={(value) => handleValueChange(value, "title")}
                placeholder={t`Event Title`}
                classNames={{ label: "!text-slate-400", input: "!text-xs", inputWrapper: "!border group-data-[disabled=true]:text-slate-200 border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }}
                className="group w-full pr-4  !border-transparent"
                variant="bordered"
            >
            </Input>
            <div className="flex gap-0.5 w-full">
                <ClockIcon className="w-4 text-slate-400" />
                <div className="align-center mt-2 flex flex-col justify-center items-center gap-2 flex-1">
                    <Popover showArrow ref={popoverRef} backdrop="opaque" classNames={{ backdrop: "bg-transparent" }}>
                        <PopoverTrigger>
                            <Input
                                size="sm"
                                value={format(event?.start || new Date(), "yyyy/MM/dd HH:mm:ss")}
                                disabled={event?.allDay}
                                classNames={{ input: "!text-xs", inputWrapper: "!border group-data-[disabled=true]:text-slate-200 border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }}
                                className="group flex-1 px-2 !border-transparent"
                                variant="bordered"
                                onValueChange={(value) => handleValueChange(value, "start")}
                            />
                        </PopoverTrigger>
                        <PopoverContent>
                            <DateCalendar value={new Date(event?.start || new Date())} plugins={[<TimePicker position="bottom" />]} onChange={(date) => handleChangeDate(date, "start")} shadow={false} className="!border-none" highlightToday={false}>
                            </DateCalendar>
                        </PopoverContent>
                    </Popover>
                    <ArrowDownIcon className="w-4 text-slate-400" />
                    <Popover showArrow ref={popoverRef} backdrop="opaque" classNames={{ backdrop: "bg-transparent" }}>
                        <PopoverTrigger>
                            <Input
                                size="sm"
                                value={format(event?.end || new Date(), "yyyy/MM/dd HH:mm:ss")}
                                disabled={event?.allDay}
                                classNames={{ input: "!text-xs", inputWrapper: "!border border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }}
                                className="group flex-1 px-2 !border-transparent"
                                variant="bordered"
                                onValueChange={(value) => handleValueChange(value, "end")}
                            />
                        </PopoverTrigger>
                        <PopoverContent>
                            <DateCalendar value={new Date(event?.end || new Date())} plugins={[<TimePicker position="bottom" />]} onChange={(date) => handleChangeDate(date, "end")} shadow={false} className="!border-none" highlightToday={false}>
                            </DateCalendar>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
                <EyeDropperIcon className="w-4 text-slate-400" />
                <Swatch
                    colors={preset}
                    color={event?.color || "#F44E3B"}
                    onChange={(hsva) => handleValueChange("color", hsvaToHex(hsva))}
                    rectProps={{ className: 'size-6 rounded-md cursor-pointer !mb-0' }}
                />
            </div>
            <div className="flex w-full items-center gap-4 mt-2">
                <ArrowPathRoundedSquareIcon className="w-4 text-slate-400" />
                <Select className="flex-1" aria-label="rrule" selectedKeys={[event?.rrule_type || 0]} onSelectionChange={handleChangeSelection} size="sm" variant="bordered" >
                    <SelectItem key={0} aria-label="No Repeat">
                        {t`No Repeat`}
                    </SelectItem>
                    <SelectItem key={1} aria-label="Everyday">
                        {t`Everyday`}
                    </SelectItem>
                    <SelectItem key={2} aria-label="Every Weekday">
                        {t`Every Weekday`}
                    </SelectItem>
                    <SelectItem key={3} aria-label="Per Week">
                        {t`Per Week`}
                    </SelectItem>
                    <SelectItem key={4} aria-label="Per 2 Weeks">
                        {t`Per 2 Weeks`}
                    </SelectItem>
                    <SelectItem key={5} aria-label="Mounthly">
                        {i18n._(`Monthly on the {day}th`, { day: day })}
                    </SelectItem>
                    <SelectItem key={6} aria-label="Last of the Month">
                        {i18n._(`Last {byDay} of the Month`, { byDay: byDay })}
                    </SelectItem>
                </Select>
            </div>
        </Form>
    )
}

const TasksPage = () => {
    const { t } = useLingui();

    const isLaptap = useMediaQuery({ minWidth: 768 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const eventFormRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [hasEdited, setHasEdited] = useState(false);

    const params = useParams();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [choosenID, setChosenID] = useState<string | undefined>(undefined);
    const calendarRef = useRef<CalendarRef>(null);
    const handleEventChange = (newEvent: Event) => {
        setEvents(events.concat(newEvent));
    }

    const todayEvent = useMemo(() => {
        return getEventsForDate(events, selectedDate);
    }, [events, selectedDate]);

    const choosenEvent = useMemo(() => {
        if (choosenID) {
            return events.find((e) => e.id === choosenID);
        }
    }, [choosenID, events])
    const blocker = useBlocker(() => hasEdited && !!choosenID);

    const handleOpenCalendarModal = () => {
        calendarRef.current?.handleOpenModalInMobile();
    }

    useEffect(() => {
        if (blocker.state === "blocked" && choosenEvent) {
            (async () => {
                try {
                    handleSubmitEvent(choosenEvent);      // 提交当前事件 不接收是否成功
                } catch (err) {
                    toast.error(t`Auto save failed, please try again later.`);
                } finally {
                    blocker.proceed();
                }
            })();
        }
    }, [blocker, choosenEvent, hasEdited]);



    const handleSubmitEvent = async (event: Event) => {
        if (!event.id || !hasEdited) return;
        setHasEdited(false);
        UpdateEventRequest(params.id || "", event.id, event).then((res) => {
            if (res.code !== responseCode.SUCCESS) {
                toast.error(t`Update event failed`);
            }
        })
    }



    const handleUpdateEvent = (id: string | undefined, field: string, value: any) => {
        if (!id) return;
        setHasEdited(true);
        setEvents((prev) => {
            return prev.map((e) => {
                if (e.id == id) {
                    return {
                        ...e,
                        [field]: value
                    }
                }
                return e;
            });
        })
    }



    const handleEventClick = (event: Event) => {
        setChosenID(event.id);
    }

    useEffect(() => {
        const handleClickOutside = async (event: MouseEvent) => {
            const target = event.target as Node;

            const isInForm = eventFormRef.current?.contains(target);
            // const isInModal = modalRef.current?.contains?.(target);
            const isInPopover = popoverRef.current?.contains?.(target);
            if (
                !isInPopover &&
                !isInForm
            ) {
                if (choosenEvent) {
                    await handleSubmitEvent(choosenEvent);
                    setChosenID(undefined);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [choosenEvent, events]);

    useEffect(() => {
        var start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        var end = addDays(new Date(selectedDate), 7);
        end.setHours(23, 59, 59, 999);

        GetEventListRequest({ workspace_id: params.id || "", from: start.toISOString(), to: end.toISOString() }).then((res) => {
            if (res.data) {
                setEvents(res.data.events || []);
            }
        })
    }, [selectedDate])

    return (
        <>
            <div className="flex-1 flex flex-col">
                {
                    !isDesktop && (
                        <>
                            <div className="flex justify-between py-2 px-4 ">
                                <div>
                                    <AvatarMenu>
                                    </AvatarMenu>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IconCalendarClock size="extra-large" className="cursor-pointer" onClick={handleOpenCalendarModal} />
                                </div>
                            </div>
                        </>
                    )
                }
                <div className="flex-1 p-4 flex gap-2">
                    {
                        isLaptap && (
                            <>
                                <Card className="h-full flex-1">
                                    <CardBody>
                                        <Calendar ref={calendarRef} events={events} date={selectedDate} onChangeDate={setSelectedDate} onEventChange={handleEventChange} eventClick={handleEventClick} />
                                    </CardBody>
                                </Card>
                            </>
                        )
                    }
                    <div ref={eventFormRef} className="flex-1 md:flex-none">
                        <Card className="h-full w-full">
                            <CardBody className="flex w-full md:w-72 flex-col gap-2">
                                <div className="flex items-center justify-between" >
                                    <h2 className="text-lg font-semibold">{t`Schedules`}</h2>
                                    <CalendarIcon className="w-6" />
                                </div>
                                <div className="w-full px-0">
                                    <MameosDayPicker date={selectedDate} onDateChange={setSelectedDate} />
                                    {
                                        choosenEvent ? (
                                            <>
                                                <div className="mt-2" >
                                                    <Divider className="mb-2 bg-slate-200" />
                                                    <EventForm event={choosenEvent}
                                                        popoverRef={popoverRef}
                                                        onValueChange={(value: any, field: string) => handleUpdateEvent(choosenEvent.id, field, value)}
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <ScrollShadow size={20} className={`${isDesktop ? "max-h-[400px]" : ""} mt-2`}>
                                                    <Timeline>
                                                        {todayEvent.map((e) => (
                                                            <Timeline.Item onClick={() => setChosenID(e.id)} key={e.id} className="cursor-pointer">
                                                                <Card className="select-none">
                                                                    <CardHeader className="p-0 items-start flex flex-col">
                                                                        <div className={`w-full h-1`} style={{ backgroundColor: e.color || "#3788d8" }} >
                                                                        </div>
                                                                        <h1 className="px-3 mt-2 font-bold">
                                                                            {e.title || t`No Title Event`}
                                                                        </h1>
                                                                    </CardHeader>
                                                                    <CardBody>
                                                                        <div className="flex flex-col gap-1 text-xs">
                                                                            <span className="text-gray-600">{format(e?.start || new Date(), "yyyy-MM-dd")} - {format(e?.end || new Date(), "yyyy-MM-dd")}</span>
                                                                        </div>
                                                                    </CardBody>
                                                                </Card>
                                                            </Timeline.Item>
                                                        ))}
                                                    </Timeline>
                                                </ScrollShadow>
                                            </>
                                        )
                                    }
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
export default TasksPage;