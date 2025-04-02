import { useEffect, useState } from "react"
import { I18nProvider } from "@lingui/react"
import { i18n } from "@lingui/core"
import { loadCatalog } from "./i18n"
import AppRouter from "./routes/index.tsx";
import LoadingPage from "./pages/loading.tsx";

function App() {
  const [count, setCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // With this method we dynamically load the catalogs
    const load = async () => {
      await loadCatalog("zh_CN");
      setIsLoaded(true);
    };
    load();
  }, []);

  if (!isLoaded) {
    return <LoadingPage />
   }
   
  return (
    <I18nProvider i18n={i18n}>
        <AppRouter />
    </I18nProvider>
  )
}

export default App