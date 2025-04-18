import { Divider } from "@heroui/react";
import { SettingsWrapperProps } from "./script";
export default function SettingsWrapper(props: SettingsWrapperProps) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{props.title}</h2>
            <Divider></Divider>
            <div className={`flex flex-col gap-6 ${props.itemClasses}`}>
                {props.children}
            </div>
        </div>
    )
}