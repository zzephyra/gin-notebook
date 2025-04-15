import "./loading.css"
import { LoadingProps } from "../type"


export default function ChaseLoading({ color = "#5b5b5b", text = "" }: LoadingProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="sk-chase" style={{ '--dot-color': color } as React.CSSProperties}>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
                <div className="sk-chase-dot"></div>
            </div>
            {text &&
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {text}
                </div>
            }
        </div>
    )
}