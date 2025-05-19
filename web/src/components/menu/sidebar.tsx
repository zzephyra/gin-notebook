import { Tabs, Tab, Avatar, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { store } from "@/store";
import { Key } from "react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

interface MenuItem {
    key: string;
    label: string;
    icon: React.ReactNode;
    route: string;
}

export default function SiderBar({ menuItems }: { menuItems: MenuItem[] }) {
    const isVertical = true; // Set to true for vertical tabs
    const state = store.getState();
    const user = state.user;
    const navigate = useNavigate();

    const [openTooltip, useOpenTooltip] = useState(false);

    function handleTabClick(key: Key) {
        var selectedItem = menuItems.find((item) => item.key === key);
        if (selectedItem) {
            navigate(selectedItem.route)
        }
    }

    function handleOpenTooltip() {
        useOpenTooltip(!openTooltip);
    }

    return (
        <div className="flex h-full flex-col flex p-1 gap-2 items-center px-2">
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
                        }
                        onClick={() => handleTabClick(item.key)}
                    >
                    </Tab>
                ))}
            </Tabs>
        </div>
    )
}