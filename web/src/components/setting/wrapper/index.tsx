import { Divider } from "@heroui/react";
import { SettingsWrapperProps } from "./script";
export default function SettingsWrapper(props: SettingsWrapperProps) {
    return (
        <div className={`flex flex-col gap-2 dark:text-white mb-4 ${props.className || ''}`}>
            <h2 className="text-lg font-semibold light:text-gray-800 dark:text-white">{props.title}</h2>
            <Divider className="mb-2"></Divider>
            <div className={`flex flex-col gap-6 ${props.itemClasses}`}>
                {props.children}
            </div>
        </div>
    )
}