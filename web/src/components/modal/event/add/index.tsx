import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, SharedSelection, Switch, useDraggable } from "@heroui/react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { useLingui } from "@lingui/react/macro";
import { DateObject, Calendar } from "react-multi-date-picker";
import gregorian_zh_cn from "@/assets/js/gregorian_zh_cn";
import { ArrowLongRightIcon, ClockIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ArrowPathRoundedSquareIcon, EyeDropperIcon, PencilIcon } from "@heroicons/react/24/solid";
import { useRef } from "react";
import Swatch from '@uiw/react-color-swatch';
import { hsvaToHex } from '@uiw/color-convert';
import { Event } from "@/types/event";
import toast from "react-hot-toast";

export const preset = ['#3788d8', '#39c5bb', '#F44E3B', '#FE9200', '#FCDC00', '#DBDF00', '#008744'];



const AddNewEventModal = ({ isOpen, onOpenChange, event, onTimeChange, onUpdateEvent, onCreate }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void, event?: Event, onTimeChange?: (type: "start" | "end", date: Date) => void, onUpdateEvent?: (field: string, value: any, subfield?: string) => void, onCreate?: () => void }) => {
    const { t, i18n } = useLingui();
    const modalRef = useRef(null)
    const today = new Date();
    // 星期几（BYDAY）
    const weekdayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const byDay = weekdayMap[today.getDay()];  // 'WE'

    // 日期
    const day = today.getDate();     // 25
    const { moveProps } = useDraggable({ targetRef: modalRef, isDisabled: !isOpen });
    const handleTimeChange = (type: "start" | "end", date: DateObject | null) => {
        if (!date || !onTimeChange) return;
        const newDate = date.toDate();
        const otherDate = type === "start" ? event?.end : event?.start;
        if (!otherDate) {
            onTimeChange(type, newDate);
            return;
        }
        const isInvalid =
            (type === "start" && newDate > otherDate) ||
            (type === "end" && newDate < otherDate);
        if (isInvalid) {
            onTimeChange(type === "start" ? "start" : "end", otherDate);
            onTimeChange(type === "start" ? "end" : "start", newDate);
        } else {
            onTimeChange(type, newDate);
        }
    };

    const handleUpdateEvent = (field: string, value: any, subfield?: string) => {
        if (onUpdateEvent) {
            onUpdateEvent(field, value, subfield);
        }
    }

    const handleChangeSelection = (value: SharedSelection) => {
        const rrule_type = value.currentKey
        handleUpdateEvent("rrule_type", rrule_type);

    }

    const handleCreateEvent = () => {
        if (!event) return;

        if (!event.title || event.title.trim() === "") {
            toast.error(t`Event title is required`);
            return;
        }

        if (!event.start || !event.end || event.start.getTime() >= event.end.getTime()) {
            toast.error(t`Event start or end time is invalid`);
            return;
        }

        if (onCreate) onCreate();
    }

    return (
        <Modal ref={modalRef} isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader {...moveProps}>
                    <h2 className="text-lg font-semibold">{t`New Event`}</h2>
                </ModalHeader>
                <ModalBody>
                    <div className="flex items-center gap-2">
                        <PencilIcon className="w-4 text-slate-400" />
                        <Input
                            size="sm"
                            value={event?.title || ""}
                            onChange={(e) => handleUpdateEvent("title", e.target.value)}
                            placeholder={t`Event Title`}
                            classNames={{ input: "!text-xs", inputWrapper: "!border group-data-[disabled=true]:text-slate-200 border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }}
                            className="group w-full pr-4  !border-transparent"
                            variant="bordered"
                        />
                    </div>
                    <div className="flex pr-2 align-center mt-2">
                        <ClockIcon className="w-4 text-slate-400" />
                        <Popover showArrow>
                            <PopoverTrigger>
                                <Input size="sm" value={format(event?.start || new Date(), "yyyy/MM/dd HH:mm:ss")} disabled={event?.allDay} classNames={{ input: "!text-xs", inputWrapper: "!border group-data-[disabled=true]:text-slate-200 border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }} className="group flex-1 px-2 !border-transparent" variant="bordered" />
                            </PopoverTrigger>
                            <PopoverContent>
                                <Calendar onChange={(date) => handleTimeChange("start", date)} shadow={false} className="!border-none" highlightToday={false}>
                                </Calendar>
                            </PopoverContent>
                        </Popover>
                        <ArrowLongRightIcon className="w-4 text-slate-400" />
                        <Popover showArrow>
                            <PopoverTrigger>
                                <Input size="sm" value={format(event?.end || new Date(), "yyyy/MM/dd HH:mm:ss")} disabled={event?.allDay} classNames={{ input: "!text-xs", inputWrapper: "!border border-transparent group-data-[focus=true]:!border-default-200 group-hover:border-default-200" }} className="group flex-1 px-2 !border-transparent" variant="bordered" />
                            </PopoverTrigger>
                            <PopoverContent>
                                <Calendar onChange={(date) => handleTimeChange("end", date)} className="!border-none" locale={gregorian_zh_cn} shadow={false} highlightToday={false}>
                                </Calendar>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <RectangleGroupIcon className="w-4 text-slate-400" />
                        <Switch size="sm" isSelected={event?.allDay} onChange={() => handleUpdateEvent("allDay", !event?.allDay)}>
                            <span className="text-xs text-slate-500">{t`All Day`}</span>
                        </Switch>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <EyeDropperIcon className="w-4 text-slate-400" />
                        <Swatch
                            colors={preset}
                            color={event?.color || "#F44E3B"}
                            onChange={(hsva) => handleUpdateEvent("color", hsvaToHex(hsva))}
                            rectProps={{ className: 'size-6 rounded-md cursor-pointer' }}
                        />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <ArrowPathRoundedSquareIcon className="w-4 text-slate-400" />
                        <Select size="sm" className="w-full" selectedKeys={[event?.rrule_type || "0"]} onSelectionChange={handleChangeSelection}>
                            <SelectItem key={0}>
                                {t`No Repeat`}
                            </SelectItem>
                            <SelectItem key={1} >
                                {t`Everyday`}
                            </SelectItem>
                            <SelectItem key={2}>
                                {t`Every Weekday`}
                            </SelectItem>
                            <SelectItem key={3}>
                                {t`Per Week`}
                            </SelectItem>
                            <SelectItem key={4}>
                                {t`Per 2 Weeks`}
                            </SelectItem>
                            <SelectItem key={5}>
                                {i18n._(`Monthly on the {day}th`, { day: day })}
                            </SelectItem>
                            <SelectItem key={6}>
                                {i18n._(`Last {byDay} of the Month`, { byDay: byDay })}
                            </SelectItem>
                        </Select>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="shadow" color="default" onPress={() => onOpenChange(false)}>
                        {t`Cancel`}
                    </Button>
                    <Button size="sm" variant="shadow" color="primary" onPress={handleCreateEvent}>
                        {t`Create`}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal >
    );
}
export default AddNewEventModal;