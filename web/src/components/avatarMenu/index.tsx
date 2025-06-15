import { RootState, store } from "@/store";
import { useSelector } from "react-redux"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    useDisclosure,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar
} from "@heroui/react";
import { MenuItem } from "../menu/type";
import { useNavigate, useParams } from "react-router-dom";
import { getMenuItems } from "@/config/site";
import { Cog8ToothIcon } from "@heroicons/react/24/solid";
import { useLingui } from "@lingui/react/macro";
import { Logout } from "@/store/features/user";
import { CleanWorkspaceState } from "@/store/features/workspace";
import { UserLogOutRequest } from "@/features/api/user";

const AvatarMenu = ({ avatarSize }: { avatarSize?: "sm" | "md" | "lg" | undefined }) => {
    const user = useSelector((state: RootState) => state.user);
    const navigate = useNavigate();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    let params = useParams();
    const menuItems = getMenuItems(params.id || "");
    const { t } = useLingui();
    const handleSwitchWorkspace = () => {
        navigate("/select");
    }

    const handleLogout = () => {
        store.dispatch(Logout())
        store.dispatch(CleanWorkspaceState())
        UserLogOutRequest()
    }

    return (
        <>
            <div>
                <Avatar src={user.avatar} size={avatarSize || "sm"} onClick={onOpen}>
                </Avatar>
                <Drawer placement="left" isOpen={isOpen} radius="none" size='sm' onOpenChange={onOpenChange}>
                    <DrawerContent>
                        <DrawerHeader className="flex items-center gap-2">
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="relative">
                                        <Avatar src={user.avatar} />
                                        <div className="absolute flex items-center justify-center right-0 top-0 h-full w-full cursor-pointer  p-1 rounded-full" style={{ backgroundColor: "oklab(0 0 0 / 0.3)" }}>
                                            <Cog8ToothIcon className="w-4 fill-white" />
                                        </div>
                                    </div>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Static Actions">
                                    <DropdownItem key="switch" onClick={handleSwitchWorkspace}>{t`Switch Workspace`}</DropdownItem>
                                    <DropdownItem key="logout" className="text-danger" color="danger" onClick={handleLogout}>
                                        {t`Log out`}
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <span>
                                {user.nickname || user.email}
                            </span>
                        </DrawerHeader>
                        <DrawerBody>
                            <div className="flex flex-col gap-2">
                                {menuItems.map((item: MenuItem) => (
                                    <button
                                        key={item.key}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
                                        onClick={() => {
                                            window.location.href = item.route;
                                        }}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{t`${item.label}`}</span>
                                    </button>
                                ))}
                            </div>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </div>
        </>
    )
}
export default AvatarMenu;