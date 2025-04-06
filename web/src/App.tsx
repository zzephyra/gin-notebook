import { useEffect, useState } from "react"
import { I18nProvider } from "@lingui/react"
import { i18n } from "@lingui/core"
import { loadCatalog } from "./i18n"
import AppRouter from "./routes/index.tsx";
import LoadingPage from "./pages/loading.tsx";
import {Toaster} from 'react-hot-toast';
import { store } from '@/store';

import { getSystemLang } from "./utils/tools.ts";
import { getUserInfoApi } from "./features/api/user.ts";
function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initI18n = async () => {
      await loadCatalog(getSystemLang()); // ✅ 等待语言包加载完成
      await getUserInfoApi()
      setIsLoaded(true); // 标记为已加载
    };
    initI18n();
  }, []);

  if (!isLoaded) {
    return <LoadingPage />; // 显示加载状态，直到 i18n 完全就绪
  }

  return (
    <I18nProvider i18n={i18n}>
        <Toaster></Toaster>
        <AppRouter />
    </I18nProvider>
  )
}

export default App