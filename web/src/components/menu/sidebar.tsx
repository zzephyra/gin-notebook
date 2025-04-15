import { Tabs, Tab, Avatar, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { store } from "@/store";
import { Key } from "react";
import { useState } from "react";

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
}

export default function SiderBar({ menuItems }: { menuItems: MenuItem[] }) {
    const isVertical = true; // Set to true for vertical tabs
    const state = store.getState();
    const user = state.user;
    const [openTooltip, useOpenTooltip] = useState(false);

    function handleTabClick(key: Key) {
        if (key === "user") {
            // Handle user tab click
            console.log("User tab clicked");
        }
    }

    function handleOpenTooltip() {
        useOpenTooltip(!openTooltip);
    }

    return (
        <div className="flex h-full flex-col flex p-1 gap-2 items-center flex-nowrap overflow-x-scroll scrollbar-hide bg-transparent dark:bg-transparent border-medium border-default-200 shadow-sm rounded-medium flex-col h-full border-r-2 border-y-0 border-l-0 px-3">
            <div className="pt-1" >
                <Popover content="right-end" placement="right-end" showArrow={true}>
                    <PopoverTrigger>
                        <Avatar
                            as="button"
                            onClick={handleOpenTooltip}
                            size="sm"
                            className="cursor-pointer select-none"
                            name={user.email}
                            showFallback
                            src={user.avatar}
                            alt="User Avatar"
                        />
                    </PopoverTrigger>
                    <PopoverContent>
                        test
                    </PopoverContent>
                </Popover>
            </div>
            <Tabs aria-label="Options" variant="bordered" isVertical={isVertical} onSelectionChange={handleTabClick}
                classNames={{ tab: "h-10 w-10", tabList: "h-full border-r-2 border-0 p-1", tabWrapper: "h-full" }}>
                {menuItems.map((item) => (
                    <Tab key={item.key} className="flex items-center gap-2"
                        title={
                            <div className="flex items-center space-x-2">
                                {item.icon}
                            </div>
                        }>
                    </Tab>
                ))}
            </Tabs>
        </div>
    )
}