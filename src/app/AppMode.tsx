import { AppShell } from "./AppShell"
import {
  resolveAppMessages,
  type AppLanguage,
} from "./appI18n"
import {
  appViewDefinitions,
  defaultAppView,
  type AppViewId,
} from "./appNavigation"
import { navigateTo } from "./navigation"
import { EditScreen } from "../features/edit/EditScreen"
import { PerformScreen } from "../features/perform/PerformScreen"
import { PluginsScreen } from "../features/plugins-view/PluginsScreen"
import { ProjectScreen } from "../features/project-view/ProjectScreen"
import { SamplerScreen } from "../features/sampler/SamplerScreen"
import { SettingsScreen } from "../features/settings-view/SettingsScreen"
import { useEffect, useState } from "react"

type AppModeProps = {
  activeLanguage: AppLanguage
  activeView?: AppViewId
}

function resolveScreen(activeView: AppViewId, activeLanguage: AppLanguage) {
  const messages = resolveAppMessages(activeLanguage)
  const viewCopy = messages.views[activeView]

  switch (activeView) {
    case "perform":
      return <PerformScreen copy={viewCopy} />
    case "project":
      return <ProjectScreen copy={viewCopy} />
    case "plugins":
      return <PluginsScreen copy={viewCopy} />
    case "settings":
      return (
        <SettingsScreen
          activeLanguage={activeLanguage}
          copy={viewCopy}
          onLanguageChange={(language) => navigateTo(`/?view=settings&lang=${language}`)}
          onOpenLab={() => navigateTo(`/lab?lang=${activeLanguage}`)}
        />
      )
    case "sampler":
      return <SamplerScreen copy={viewCopy} />
    case "edit":
    default:
      return <EditScreen copy={viewCopy} />
  }
}

function AppViewIcon({ viewId }: { viewId: AppViewId }) {
  switch (viewId) {
    case "perform":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 5v8M12 5v8M16 5v8M6 13h2M10 13h2M14 13h2" />
        </svg>
      )
    case "edit":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="4" y="4" width="6" height="6" rx="1.2" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" />
          <rect x="14" y="14" width="6" height="6" rx="1.2" />
        </svg>
      )
    case "project":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M9 5v5a3 3 0 0 0 6 0V5" />
          <path d="M12 13v6" />
          <path d="M6 19h12" />
        </svg>
      )
    case "plugins":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M3 12h4l2-5 4 10 2-5h6" />
        </svg>
      )
    case "settings":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 3v3M12 18v3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M3 12h3M18 12h3M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      )
    case "sampler":
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      )
  }
}

export function AppMode({
  activeLanguage,
  activeView = defaultAppView,
}: AppModeProps) {
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)
  const messages = resolveAppMessages(activeLanguage)
  const activeDefinition =
    appViewDefinitions.find((view) => view.id === activeView) ?? appViewDefinitions[0]

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(Boolean(document.fullscreenElement))
    }

    handleFullscreenChange()
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  async function toggleFullscreen() {
    if (typeof document === "undefined") {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }

    if (!document.documentElement.requestFullscreen) {
      return
    }

    await document.documentElement.requestFullscreen().catch(() => {})
  }

  return (
    <AppShell subtitle={messages.appMode.subtitle} title={messages.appMode.title}>
      <section className="app-mode-window app-surface-window">
        <header className="app-mode-window-header">
          <strong className="app-mode-window-brand">{messages.appMode.title.toLowerCase()}</strong>
          <div className="app-mode-header-actions">
            <nav className="app-mode-nav" aria-label={messages.appMode.navigationAriaLabel}>
              {appViewDefinitions.map((view) => (
                <button
                  aria-label={messages.views[view.id].label}
                  className={view.id === activeDefinition.id ? "mode-switch-active" : ""}
                  key={view.id}
                  onClick={() => navigateTo(`/?view=${view.id}&lang=${activeLanguage}`)}
                  title={messages.views[view.id].label}
                  type="button"
                >
                  <AppViewIcon viewId={view.id} />
                  <span className="sr-only">{messages.views[view.id].label}</span>
                </button>
              ))}
            </nav>

            <button
              aria-label={isFullscreenActive ? "Salir de pantalla completa" : "Pantalla completa"}
              className="app-mode-fullscreen-toggle"
              onClick={toggleFullscreen}
              title={isFullscreenActive ? "Salir de pantalla completa" : "Pantalla completa"}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                {isFullscreenActive ? (
                  <path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4" />
                ) : (
                  <path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5" />
                )}
              </svg>
            </button>
          </div>
        </header>

        <div className="app-mode-window-content">
          {resolveScreen(activeDefinition.id, activeLanguage)}
        </div>
      </section>
    </AppShell>
  )
}
