import { Tabs, Tab, Avatar, Popover, PopoverTrigger, PopoverContent, Divider, Button } from "@heroui/react";
import { RootState, store } from "@/store";
import { Key } from "react";
import { useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from "react-redux";
import { useLingui } from "@lingui/react/macro";
import { ArrowLeftRight } from "lucide-react";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/solid";
import { Logout } from "@/store/features/user";
import { CleanWorkspaceState } from "@/store/features/workspace";
import { UserLogOutRequest } from "@/features/api/user";
import { getMenuItems } from "@/config/site";
import { GithubIcon } from "../icons";
import { ThemeSwitcher } from "../ThemeSwitch/switch";

export default function SiderBar() {
    const isVertical = true; // Set to true for vertical tabs
    const { t } = useLingui();
    let params = useParams();

    const menuItems = getMenuItems(params.id || "");
    const user = useSelector((state: RootState) => state.user);
    const workspace = useSelector((state: RootState) => state.workspace);

    const navigate = useNavigate();
    const currentMenuKey = menuItems.find((item) =>
        location.pathname == item.route
    )?.key;
    const [openTooltip, useOpenTooltip] = useState(false);
    function handleTabClick(key: Key | null) {
        var selectedItem = menuItems.find((item) => item.key === key);
        if (selectedItem) {
            navigate(selectedItem.route)
        }
    }

    const handleLogout = () => {
        store.dispatch(Logout())
        store.dispatch(CleanWorkspaceState())
        UserLogOutRequest()
    }

    function handleOpenTooltip() {
        useOpenTooltip(!openTooltip);
    }

    return (
        <div className="flex h-full flex-col flex p-1 gap-2 items-center px-2 z-[10000] bg-white">
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
                    <PopoverContent className="w-64 max-h-[400px] overflow-y-auto">
                        <div className="p-2 w-full text-[12px]">
                            <div className="pb-3 flex items-center gap-2">
                                <div className="flex  gap-2">
                                    <Avatar src={workspace.currentWorkspace?.avatar} aria-label="Workspace Avatar" radius="sm" size="md" isBordered>
                                    </Avatar>
                                    <div className="flex flex-col pl-1">
                                        <span>
                                            {t`Workspace: `}{workspace.currentWorkspace?.name || t`No Workspace`}
                                        </span>
                                        <span className="text-[12px] text-gray-500">
                                            {workspace.currentWorkspace?.memberCount || 1} {(workspace.currentWorkspace?.memberCount || 1) === 1 ? t`member` : t`members`}
                                        </span>
                                    </div>

                                </div>
                            </div>
                            <div className="mb-2">
                                <Button size="sm" variant="ghost" className="border-1" onPress={() => navigate(`/select`)}>
                                    <div className="flex items-center gap-1" >
                                        <ArrowLeftRight className="w-3"></ArrowLeftRight>
                                        <span className="">{t`Switch`}</span>
                                    </div>
                                </Button>
                            </div>
                            <Divider></Divider>
                            <div className="h-7 mt-2 flex items-center gap-1 text-[12px] text-gray-600 cursor-pointer hover:bg-gray-100 py-2 px-1 rounded-md" onClick={handleLogout}>
                                <ArrowRightStartOnRectangleIcon className="w-5" />
                                {t`Log out`}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <Tabs className="flex-1" aria-label="Options" variant="bordered" defaultSelectedKey={currentMenuKey} isVertical={isVertical} onSelectionChange={handleTabClick}
                classNames={{ tab: "h-10 w-10", tabList: "h-full border-r-2 border-0 p-1", tabWrapper: "h-full" }}>
                {menuItems.map((item) => (
                    <Tab key={item.key} className="flex items-center gap-2"
                        title={
                            <div className="flex items-center space-x-2">
                                <item.icon className="w-5 h-5" />
                            </div>
                        }
                    >
                    </Tab>
                ))}
            </Tabs>
            <div className="py-2 flex gap-3 flex-col">
                <ThemeSwitcher onlyIcon></ThemeSwitcher>
                <GithubIcon onClick={() => { window.open("https://github.com/1131659949/gin-notebook") }} className="w-6 h-6 cursor-pointer hover:text-gray-500" />
            </div>
        </div>
    )
}