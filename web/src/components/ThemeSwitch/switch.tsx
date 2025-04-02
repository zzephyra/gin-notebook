import {useTheme} from "@heroui/use-theme";
import {Button} from "@heroui/button";
import SunIcon from "@/components/icons/sun";
import MoonIcon from "@/components/icons/moon";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="content-center">
      <Button isIconOnly onClick={() => setTheme(theme == "light"? "dark": "light")}  >
        {theme == "light"? <SunIcon filled={true} /> : <MoonIcon filled={true}/>} 
      </Button>
    </div>
  )
};