import { useTheme } from "@heroui/use-theme";
import { Button } from "@heroui/button";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const ThemeSwitcher = ({ onlyIcon, radius, size }: { onlyIcon?: boolean, radius?: "none" | "sm" | "md" | "lg" | "full", size?: "sm" | "md" | "lg" | undefined }) => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="content-center cursor-pointer">
      {
        onlyIcon ? (
          <div className="content-center h-6 w-6 cursor-pointer" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {
              theme === "light" ? <SunIcon className="w-full h-full" /> : <MoonIcon className="w-full h-full" />
            }
          </div>
        ) : (
          <Button radius={radius} isIconOnly onPress={() => setTheme(theme === "light" ? "dark" : "light")} size={size} >
            {theme === "light" ? <SunIcon className="w-full h-full" /> : <MoonIcon className="w-full h-full" />}
          </Button>
        )
      }
    </div>
  )
};