import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { format, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DayPicker, useDayPicker, NavProps, Modifiers } from "react-day-picker";

function CustomNavigation({
    // previousMonth,
    // nextMonth,
    onPreviousClick,
    onNextClick
}: NavProps) {
    const { months } = useDayPicker();


    const currentMonth = useMemo(() => {
        var month = months[0].date || new Date();
        return format(month, 'MMMM yyyy');

    }, [months]);

    const handlePrev = () =>
        onPreviousClick?.({} as React.MouseEvent<HTMLButtonElement>);
    const handleNext = () =>
        onNextClick?.({} as React.MouseEvent<HTMLButtonElement>);

    return (
        <div className="flex justify-between items-center mb-2">
            <div className="text-[12px] text-slate-500 font-semibold">
                <span>
                    {
                        currentMonth
                    }
                </span>
            </div>
            <div className="flex gap-1">
                <Button isIconOnly radius="full" className="w-5 h-5 min-w-0" onPress={handlePrev}>
                    <ArrowLeftIcon className="w-3 " />
                </Button>
                <Button isIconOnly radius="full" className="w-5 h-5 min-w-0" onPress={handleNext}>
                    <ArrowRightIcon className="w-3" />
                </Button>
            </div>
        </div>
    );
}

function EmptyNav() {
    return (
        <span className="absolute">
        </span>
    )
}

const MameosDayPicker = ({ date, onDateChange }: { date: Date, onDateChange?: (date: Date) => void }) => {
    const [month, setMonth] = useState<Date>(date);
    const handleDayClick = (date: Date, modifiers: Modifiers) => {
        if (onDateChange) {
            onDateChange(date);
        }
        if (modifiers.outside) {       // ③ 若是跨月日期 → 切月
            setMonth(startOfMonth(date));
        }
    }

    useEffect(() => {
        if (date) setMonth(startOfMonth(date));
    }, [date]);

    return (
        <>
            <DayPicker
                // showWeekNumber
                animate
                mode="single"

                month={month}
                onMonthChange={setMonth}
                selected={date}
                key={date.getTime()}
                onDayClick={handleDayClick}
                classNames={{
                    // root: "bbtbv",
                    month_caption: "text-lg font-semibold",
                    caption_label: "",
                    weekday: "text-[11px] text-slate-400 text-center",
                    day: 'text-[11px] cursor-pointer w-4 text-slate-500 font-medium',
                    // weekend: 'bbtbv text-red-500 font-semibold',
                    today: '',
                    month_grid: "w-full",
                    day_button: "rdp-day_button !w-full !h-6 ",
                    months: "flex relative flex-col",
                    selected: 'bg-blue-500 text-white rounded-md',
                }}
                components={{
                    Nav: CustomNavigation, // Disable default navigation
                    MonthCaption: EmptyNav, // Use custom navigation component
                }}
                showOutsideDays />
        </>
    )
}

export default MameosDayPicker;