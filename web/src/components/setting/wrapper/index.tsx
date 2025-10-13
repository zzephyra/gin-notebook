import { Divider } from "@heroui/react";
import { SettingsWrapperProps } from "./script";
export default function SettingsWrapper(props: SettingsWrapperProps) {
    return (
        <div className={`flex flex-col gap-2 dark:text-white mb-4 ${props.className || ''}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold light:text-gray-800 dark:text-white">{props.title}</h2>
                {props.endComponent && <div className="mt-1">{props.endComponent}</div>}
            </div>
            <Divider className="mb-2"></Divider>
            <div className={`flex flex-col gap-6 ${props?.itemClasses || ""}`}>
                {props.children}
            </div>
        </div>
    )
}