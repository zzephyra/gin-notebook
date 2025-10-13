import { useEffect, useState } from "react";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { loadCatalog } from "./i18n";
import AppRouter from "./routes/index.tsx";
import LoadingPage from "./pages/loading.tsx";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { getSystemLang } from "./utils/tools.ts";
import { getUserInfoRequest, storageUserDeviceRequest } from "./features/api/user.ts";
import { getSettingsRequest } from "./features/api/settings.ts";
import { responseCode } from "./features/constant/response.ts";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUIProvider } from "@heroui/react";
import { AppThemeProvider } from "./contexts/UIThemeContext.tsx";

const queryClient = new QueryClient();


function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  useEffect(() => {
    const initI18n = async () => {
      try {
        await loadCatalog(getSystemLang()); // ✅ 等待语言包加载完成
        let res = await getUserInfoRequest();
        if (res.code == responseCode.SUCCESS) {
          await getSettingsRequest({});
          await storageUserDeviceRequest();
        }
        setIsLoaded(true); // 标记为已加载

      } catch (err) {
        // navigate('/auth/login'); // 跳转到登录页面
        setIsLoaded(true)
      }
    };
    initI18n();
  }, []);
  if (!isLoaded) {
    return <LoadingPage />; // 显示加载状态，直到 i18n 完全就绪
  }

  return (
    <>
      <HeroUIProvider className="h-full">
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            {googleClientId ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <I18nProvider i18n={i18n}>
                  <Toaster></Toaster>
                  <AppRouter />
                </I18nProvider>
              </GoogleOAuthProvider>
            ) : (
              <I18nProvider i18n={i18n}>
                <Toaster></Toaster>
                <AppRouter />
              </I18nProvider>
            )}
          </QueryClientProvider>
        </AppThemeProvider>
      </HeroUIProvider>
    </>
  );
}

export default App;
