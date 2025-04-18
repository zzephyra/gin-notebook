import { SettingsItemsProps } from "./script";


export default function SettingsItem(props: SettingsItemsProps) {
    return (
        <div className={`flex gap-2 ${props.className}`}>
            <div className="flex flex-col gap-2 flex-1">
                <span className="text-sm text-gray-700 flex-1 ">{props.label}</span>
                {props.description && <p className="text-xs text-gray-500">{props.description}</p>}
            </div>
            <div className="m-auto">
                {props.children}
            </div>
        </div>
    )
}