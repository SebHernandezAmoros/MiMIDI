import { useEffect, useState } from "react"
import "./App.css"
import "./app/styles/appModeCatalog.css"
import { getAppLanguageFromSearch, type AppLanguage } from "./app/appI18n"
import { AppMode } from "./app/AppMode"
import { APP_CATALOG_ROUTE, APP_LAB_ROUTE, getAppViewFromSearch, normalizeAppRoute } from "./app/appRoutes"
import { navigateTo } from "./app/navigation"
import { CatalogPage } from "./features/catalog/CatalogPage"
import LabApp from "./features/lab/LabApp"
import { TutorialOverlay } from "./features/tutorial/TutorialOverlay"
import { isTutorialSeen } from "./features/tutorial/tutorialStorage"

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

  const [tutorialActive, setTutorialActive] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)

  // Auto-start on first visit (only in AppMode, not in /lab or /catalog)
  useEffect(() => {
    const route = normalizeAppRoute(window.location.pathname)
    if (route !== APP_LAB_ROUTE && route !== APP_CATALOG_ROUTE && !isTutorialSeen()) {
      setTutorialActive(true)
      setTutorialStep(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function startBasicTutorial() {
    setTutorialStep(1)
    setTutorialActive(true)
  }

  function handleTutorialLanguageChange(lang: AppLanguage) {
    navigateTo(`/?view=piano&lang=${lang}`)
  }

  if (activeRoute === APP_LAB_ROUTE) {
    return <LabApp language={activeLanguage} />
  }

  if (activeRoute === APP_CATALOG_ROUTE) {
    return <CatalogPage />
  }

  return (
    <>
      <AppMode
        activeLanguage={activeLanguage}
        activeView={activeView}
        onStartBasicTutorial={startBasicTutorial}
      />
      <TutorialOverlay
        active={tutorialActive}
        language={activeLanguage}
        step={tutorialStep}
        onClose={() => setTutorialActive(false)}
        onLanguageChange={handleTutorialLanguageChange}
        onStep={setTutorialStep}
      />
    </>
  )
}
export default App
