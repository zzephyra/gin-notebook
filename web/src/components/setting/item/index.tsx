import { SettingsItemsProps } from "./script";


export default function SettingsItem(props: SettingsItemsProps) {
    return (
        <div className={`flex gap-2 w-full ${props.className || ''}`}>
            {props.custom ? props.children : (
                <>
                    <div className="flex flex-col gap-2 flex-1">
                        <span className="text-sm light:text-gray-700 dark:text-white  ">{props.label}</span>
                        {props.description && <p className="text-xs light:text-gray-500 dark:text-white">{props.description}</p>}
                    </div>
                    <div className="m-auto">
                        {props.children}
                    </div>
                </>
            )}
        </div>
    )
}