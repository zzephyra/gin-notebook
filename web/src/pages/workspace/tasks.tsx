import Calendar, { CalendarRef } from "@/components/fullCalendar";
import { Card, CardBody } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import "react-day-picker/style.css";
import { CalendarIcon } from "@heroicons/react/24/solid";
import MameosDayPicker from "@/components/datePicker";
import { useEffect, useRef, useState } from "react";
import { GetEventListRequest } from "@/features/api/event";
import { useParams } from "react-router-dom";
import { addDays } from "date-fns";
import { Event } from "@/types/event";
import AvatarMenu from "@/components/avatarMenu";
import { useMediaQuery } from "react-responsive";
import { IconCalendarClock } from "@douyinfe/semi-icons";

const TasksPage = () => {
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const { t } = useLingui();
    const params = useParams();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const calendarRef = useRef<CalendarRef>(null);
    const handleEventChange = (newEvent: Event) => {
        setEvents(events.concat(newEvent));
    }

    const handleOpenCalendarModal = () => {
        calendarRef.current?.onOpen();
    }

    useEffect(() => {
        GetEventListRequest({ workspace_id: params.id || "", from: selectedDate.toISOString(), to: addDays(selectedDate, 7).toISOString() }).then((res) => {
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
                    <Card className="h-full flex-1">
                        <CardBody>
                            <Calendar ref={calendarRef} events={events} date={selectedDate} onChangeDate={setSelectedDate} onEventChange={handleEventChange} />
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody className="flex w-60 flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{t`Schedules`}</h2>
                                <CalendarIcon className="w-6" />
                            </div>
                            <div className="w-full px-0">
                                <MameosDayPicker date={selectedDate} onDateChange={setSelectedDate} />
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </>
    );
}
export default TasksPage;