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
import { AudioSamplerScreen } from "../features/audio-sampler/AudioSamplerScreen"
import { SettingsScreen } from "../features/settings-view/SettingsScreen"
import {
  AudioWaveform,
  Download,
  FileText,
  Grid2x2,
  Maximize2,
  Mic,
  Minimize2,
  MoreVertical,
  Piano,
  Plug,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { setMasterVolume } from "../engine/audio/audioEngine"

type AppModeProps = {
  activeLanguage: AppLanguage
  activeView?: AppViewId
}

type ViewSettingsProps = {
  settingsOpen: boolean
  onSettingsClose: () => void
}

function resolveScreen(
  activeView: AppViewId,
  activeLanguage: AppLanguage,
  darkMode: boolean,
  onDarkModeChange: (v: boolean) => void,
  viewSettings: ViewSettingsProps,
  showKeyLabels: boolean,
  onShowKeyLabelsChange: (v: boolean) => void,
  masterVolume: number,
  onMasterVolumeChange: (v: number) => void,
) {
  const messages = resolveAppMessages(activeLanguage)
  const viewCopy = messages.views[activeView]

  switch (activeView) {
    case "piano":
      return <PerformScreen copy={viewCopy} language={activeLanguage} {...viewSettings} />
    case "project":
      return <ProjectScreen copy={viewCopy} language={activeLanguage} />
    case "plugins":
      return <PluginsScreen copy={viewCopy} language={activeLanguage} {...viewSettings} />
    case "settings":
      return (
        <SettingsScreen
          activeLanguage={activeLanguage}
          darkMode={darkMode}
          masterVolume={masterVolume}
          onDarkModeChange={onDarkModeChange}
          onLanguageChange={(language) => navigateTo(`/?view=settings&lang=${language}`)}
          onMasterVolumeChange={onMasterVolumeChange}
          onOpenLab={() => navigateTo(`/lab?lang=${activeLanguage}`)}
          onShowKeyLabelsChange={onShowKeyLabelsChange}
          showKeyLabels={showKeyLabels}
          {...viewSettings}
        />
      )
    case "pad":
      return <SamplerScreen copy={viewCopy} language={activeLanguage} {...viewSettings} />
    case "sampler":
      return <AudioSamplerScreen copy={viewCopy} language={activeLanguage} {...viewSettings} />
    case "edit":
    default:
      return <EditScreen copy={viewCopy} language={activeLanguage} {...viewSettings} />
  }
}

function AppViewIcon({ viewId }: { viewId: AppViewId }) {
  switch (viewId) {
    case "piano":
      return <Piano size={18} />
    case "pad":
      return <Grid2x2 size={18} />
    case "sampler":
      return <Mic size={18} />
    case "plugins":
      return <Plug size={18} />
    case "edit":
      return <AudioWaveform size={18} />
    case "project":
      return <Download size={18} />
    case "settings":
      return <Settings size={18} />
    default:
      return <FileText size={18} />
  }
}

export function AppMode({
  activeLanguage,
  activeView = defaultAppView,
}: AppModeProps) {
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mimidi-dark-mode") === "true")
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false)
  const [showKeyLabels, setShowKeyLabels] = useState(() => {
    const stored = localStorage.getItem("mimidi-show-key-labels")
    return stored === null ? true : stored === "true"
  })
  const [masterVolume, setMasterVolumeState] = useState(() => {
    const stored = localStorage.getItem("mimidi-master-volume")
    return stored !== null ? parseFloat(stored) : 0.8
  })

  useEffect(() => {
    setMasterVolume(masterVolume)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { localStorage.setItem("mimidi-dark-mode", String(darkMode)) }, [darkMode])
  useEffect(() => { localStorage.setItem("mimidi-show-key-labels", String(showKeyLabels)) }, [showKeyLabels])
  useEffect(() => { localStorage.setItem("mimidi-master-volume", String(masterVolume)) }, [masterVolume])

  function handleDarkModeChange(v: boolean) { setDarkMode(v) }
  function handleShowKeyLabelsChange(v: boolean) { setShowKeyLabels(v) }

  function handleMasterVolumeChange(v: number) {
    setMasterVolumeState(v)
    setMasterVolume(v)
  }
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

  const viewSettings: ViewSettingsProps = {
    settingsOpen: isViewSettingsOpen,
    onSettingsClose: () => setIsViewSettingsOpen(false),
  }

  return (
    <AppShell subtitle={messages.appMode.subtitle} title={messages.appMode.title}>
      <section
        className="app-mode-window app-surface-window"
        data-show-key-labels={showKeyLabels ? undefined : "false"}
        data-ui-theme={darkMode ? "dark" : undefined}
      >
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
              aria-label={isFullscreenActive ? messages.appMode.exitFullscreen : messages.appMode.enterFullscreen}
              className="app-mode-fullscreen-toggle"
              onClick={toggleFullscreen}
              title={isFullscreenActive ? messages.appMode.exitFullscreen : messages.appMode.enterFullscreen}
              type="button"
            >
              {isFullscreenActive ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              aria-label={messages.appMode.viewOptions}
              className="app-mode-fullscreen-toggle"
              onClick={() => setIsViewSettingsOpen(true)}
              title={messages.appMode.viewOptions}
              type="button"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </header>

        <div className="app-mode-window-content">
          {resolveScreen(activeDefinition.id, activeLanguage, darkMode, handleDarkModeChange, viewSettings, showKeyLabels, handleShowKeyLabelsChange, masterVolume, handleMasterVolumeChange)}
        </div>
      </section>
    </AppShell>
  )
}
