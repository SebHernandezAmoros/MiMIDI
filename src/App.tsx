import { useEffect, useState } from "react"
import "./App.css"
import { AppHome } from "./app/AppHome"
import { APP_LAB_ROUTE, normalizeAppRoute } from "./app/appRoutes"
import LabApp from "./features/lab/LabApp"

function navigateTo(pathname: string) {
  if (window.location.pathname === pathname) {
    return
  }

  window.history.pushState({}, "", pathname)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

function App() {
  const [activeRoute, setActiveRoute] = useState(() =>
    normalizeAppRoute(window.location.pathname),
  )

  useEffect(() => {
    const syncRoute = () => {
      setActiveRoute(normalizeAppRoute(window.location.pathname))
    }

    window.addEventListener("popstate", syncRoute)

    return () => {
      window.removeEventListener("popstate", syncRoute)
    }
  }, [])

  if (activeRoute === APP_LAB_ROUTE) {
    return <LabApp />
  }

  return <AppHome onOpenLab={() => navigateTo(APP_LAB_ROUTE)} />
}
export default App
