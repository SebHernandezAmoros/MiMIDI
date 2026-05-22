import { AppDialog } from "../../app/components/AppDialog"
import { resolveAppMessages, type AppLanguage } from "../../app/appI18n"

type SettingsScreenProps = {
  activeLanguage: AppLanguage
  darkMode: boolean
  masterVolume: number
  onDarkModeChange: (v: boolean) => void
  onLanguageChange: (language: AppLanguage) => void
  onMasterVolumeChange: (v: number) => void
  onOpenLab: () => void
  settingsOpen: boolean
  onSettingsClose: () => void
  showKeyLabels: boolean
  onShowKeyLabelsChange: (v: boolean) => void
}

export function SettingsScreen({
  activeLanguage,
  darkMode,
  masterVolume,
  onDarkModeChange,
  onLanguageChange,
  onMasterVolumeChange,
  onOpenLab,
  settingsOpen,
  onSettingsClose,
  showKeyLabels,
  onShowKeyLabelsChange,
}: SettingsScreenProps) {
  const m = resolveAppMessages(activeLanguage).views.settings

  return (
    <>
    <section className="app-mock-screen" aria-label="Workspace Settings">
      <div className="app-settings-groups">
        <section className="ui-list-section" aria-label={m.sections.language}>
          <span className="ui-list-section-title">{m.sections.language}</span>
          <label className="ui-list-row" style={{ cursor: "default" }} htmlFor="settings-language">
            <span className="ui-list-icon">L</span>
            <span className="ui-list-label">{m.items.language}</span>
            <select
              id="settings-language"
              value={activeLanguage}
              onChange={(event) => onLanguageChange(event.target.value as AppLanguage)}
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </label>
        </section>

        <section className="ui-list-section" aria-label={m.sections.theme}>
          <span className="ui-list-section-title">{m.sections.theme}</span>
          <div className="ui-list-row ui-list-row-static">
            <span className="ui-list-icon">S</span>
            <span className="ui-list-label">{m.items.darkMode}</span>
            <label className="ui-toggle" aria-label={m.items.darkMode}>
              <input
                checked={darkMode}
                onChange={() => onDarkModeChange(!darkMode)}
                type="checkbox"
              />
              <span />
            </label>
          </div>
        </section>

        <section className="ui-list-section" aria-label={m.sections.piano}>
          <span className="ui-list-section-title">{m.sections.piano}</span>
          <div className="ui-list-row ui-list-row-static">
            <span className="ui-list-icon">K</span>
            <span className="ui-list-label">{m.items.showKeyLabels}</span>
            <label className="ui-toggle" aria-label={m.items.showKeyLabels}>
              <input
                checked={showKeyLabels}
                onChange={() => onShowKeyLabelsChange(!showKeyLabels)}
                type="checkbox"
              />
              <span />
            </label>
          </div>
        </section>

        <section className="ui-list-section" aria-label={m.sections.audio}>
          <span className="ui-list-section-title">{m.sections.audio}</span>
          <label className="ui-list-row" style={{ cursor: "default" }} htmlFor="settings-master-volume">
            <span className="ui-list-icon">V</span>
            <span className="ui-list-label">{m.items.masterVolume}</span>
            <span className="ui-list-value">{Math.round(masterVolume * 100)}%</span>
          </label>
          <div className="app-settings-volume-slider-row">
            <input
              className="app-settings-volume-slider"
              id="settings-master-volume"
              max={1}
              min={0}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              step={0.01}
              type="range"
              value={masterVolume}
            />
          </div>
        </section>

        <section className="ui-list-section" aria-label={m.sections.lab}>
          <span className="ui-list-section-title">{m.sections.lab}</span>
          <button className="ui-list-row" onClick={onOpenLab} type="button">
            <span className="ui-list-icon">L</span>
            <span className="ui-list-label">{m.items.goToLab}</span>
            <span className="ui-list-arrow" aria-hidden="true">›</span>
          </button>
        </section>
      </div>
    </section>

    <AppDialog
      description={m.optionsDesc}
      onClose={onSettingsClose}
      open={settingsOpen}
      title={m.optionsTitle}
    />
    </>
  )
}
