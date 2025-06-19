import "./loading.css"
import { LoadingProps } from "../type"
import React from "react";


const ChaseLoading = ({ color = "#5b5b5b", text = "", className, size = "40px" }: LoadingProps) => {
    var chaseSize = typeof size === "number" ? `${size}px` : size;

    return (
        <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
            <div className="sk-chase" style={{ '--dot-color': color, width: chaseSize, height: chaseSize } as React.CSSProperties}>
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

export default React.memo(ChaseLoading)