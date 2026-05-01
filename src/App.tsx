import { useEffect, useState } from "react"
import "./App.css"
import { AppMode } from "./app/AppMode"
import { APP_LAB_ROUTE, getAppViewFromSearch, normalizeAppRoute } from "./app/appRoutes"
import LabApp from "./features/lab/LabApp"

function App() {
  const [activeRoute, setActiveRoute] = useState(() =>
    normalizeAppRoute(window.location.pathname),
  )
  const [activeView, setActiveView] = useState(() =>
    getAppViewFromSearch(window.location.search),
  )

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute(normalizeAppRoute(window.location.pathname))
      setActiveView(getAppViewFromSearch(window.location.search))
    }

    window.addEventListener("popstate", syncRoute)

    return () => {
      window.removeEventListener("popstate", syncRoute)
    }
  }, [])

  if (activeRoute === APP_LAB_ROUTE) {
    return <LabApp />
  }

  return <AppMode activeView={activeView} />
}
export default App
