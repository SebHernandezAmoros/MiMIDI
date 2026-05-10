import { useEffect, useState } from "react"
import "./App.css"
import "./app/styles/appModeCatalog.css"
import { getAppLanguageFromSearch } from "./app/appI18n"
import { AppMode } from "./app/AppMode"
import { APP_CATALOG_ROUTE, APP_LAB_ROUTE, getAppViewFromSearch, normalizeAppRoute } from "./app/appRoutes"
import { CatalogPage } from "./features/catalog/CatalogPage"
import LabApp from "./features/lab/LabApp"

function App() {
  const [activeRoute, setActiveRoute] = useState(() =>
    normalizeAppRoute(window.location.pathname),
  )
  const [activeView, setActiveView] = useState(() =>
    getAppViewFromSearch(window.location.search),
  )
  const [activeLanguage, setActiveLanguage] = useState(() =>
    getAppLanguageFromSearch(window.location.search),
  )

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute(normalizeAppRoute(window.location.pathname))
      setActiveView(getAppViewFromSearch(window.location.search))
      setActiveLanguage(getAppLanguageFromSearch(window.location.search))
    }

    window.addEventListener("popstate", syncRoute)

    return () => {
      window.removeEventListener("popstate", syncRoute)
    }
  }, [])

  if (activeRoute === APP_LAB_ROUTE) {
    return <LabApp />
  }

  if (activeRoute === APP_CATALOG_ROUTE) {
    return <CatalogPage />
  }

  return <AppMode activeLanguage={activeLanguage} activeView={activeView} />
}
export default App
