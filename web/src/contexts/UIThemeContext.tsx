// app-theme.tsx
import { useTheme } from "@heroui/use-theme";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Ctx = {
    theme: string;              // 声明的模式
    resolved: "light" | "dark";    // 解析后的实际效果（system -> 跟随系统）
    setTheme: (t: ThemeMode) => void;
    toggle: () => void;
};

const C = createContext<Ctx | null>(null);

function getSystemPrefersDark() {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, setTheme } = useTheme();

    const [resolved, setResolved] = useState<"light" | "dark">(() => {
        const dark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
        return dark ? "dark" : "light";
    });


    // 跟随系统（仅当 theme === 'system'）
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            if (theme === "system") {
                setResolved(mql.matches ? "dark" : "light");
            }
        };
        mql.addEventListener?.("change", onChange);
        return () => mql.removeEventListener?.("change", onChange);

    }, [theme]);

    // 主题变化：写入本地、更新 resolved
    useEffect(() => {
        localStorage.setItem("app-theme", theme);
        const dark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
        setResolved(dark ? "dark" : "light");

        const body = document.body;
        if (theme === "light") {
            if (body.hasAttribute('theme-mode')) {
                body.removeAttribute('theme-mode');
            }
        } else {
            body.setAttribute('theme-mode', 'dark');
        }
    }, [theme]);

    const toggle = () => setTheme(resolved === "dark" ? "light" : "dark");

    const value = useMemo<Ctx>(() => ({ theme, resolved, setTheme, toggle }), [theme, resolved]);
    return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAppTheme() {
    const ctx = useContext(C);
    if (!ctx) throw new Error("useAppTheme must be used within <AppThemeProvider>");
    return ctx;
}