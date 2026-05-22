import { useState } from "react"
import {
  Maximize2, Search, Play,
  Piano, Grid2x2, AudioWaveform, Plug, Settings, Trash2, ArrowLeft, Upload, Folder, MoreVertical,
} from "lucide-react"
import { getClassicAppThemeStyle } from "../../app/appTheme"
import "./CatalogPage.css"

type ThemeMode = "light" | "dark"

function PreviewBox({
  children,
  theme,
  fullWidth = false,
}: {
  children: React.ReactNode
  theme: ThemeMode
  fullWidth?: boolean
}) {
  return (
    <div
      className={`catalog-preview ${theme === "dark" ? "catalog-preview-dark" : ""}`}
      data-ui-theme={theme}
      style={fullWidth ? { width: "100%" } : undefined}
    >
      {children}
    </div>
  )
}

function SectionHeader({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="catalog-section-header">
      <h2>{title}</h2>
      <span className="catalog-section-tag">{tag}</span>
    </div>
  )
}

export function CatalogPage() {
  const [theme, setTheme] = useState<ThemeMode>("light")
  const [toggleA, setToggleA] = useState(false)
  const [toggleB, setToggleB] = useState(true)
  const [checkA, setCheckA] = useState(false)
  const [checkB, setCheckB] = useState(true)

  function navigateHome() {
    window.history.pushState({}, "", "/")
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const otherTheme = theme === "light" ? "dark" : "light"

  return (
    <main className="catalog-page" style={getClassicAppThemeStyle()}>
      {/* Encabezado */}
      <header className="catalog-header">
        <div className="catalog-header-copy">
          <h1>mimidi ui library</h1>
          <p>Catálogo de primitivos CSS reutilizables del modo app · <code>ui-library.css</code></p>
        </div>
        <div className="catalog-header-controls">
          <button
            className="catalog-theme-toggle"
            onClick={() => setTheme(otherTheme)}
            type="button"
          >
            {theme === "light" ? "◑ Modo oscuro" : "◐ Modo claro"}
          </button>
          <button className="catalog-back-btn" onClick={navigateHome} type="button">
            ← Volver a la app
          </button>
        </div>
      </header>

      <div className="catalog-sections">

        {/* TOKENS */}
        <section className="catalog-section">
          <SectionHeader title="Tokens de color" tag=":root / [data-ui-theme]" />
          <PreviewBox theme={theme} fullWidth>
            <div className="catalog-token-grid">
              {[
                { name: "--ui-color-text", value: theme === "light" ? "#303030" : "#f0f0f0" },
                { name: "--ui-color-text-muted", value: theme === "light" ? "#686868" : "#a0a0a0" },
                { name: "--ui-color-accent", value: theme === "light" ? "#c82828" : "#ff3150" },
                { name: "--ui-color-surface", value: "surface" },
                { name: "--ui-color-surface-raised", value: "surface raised" },
                { name: "--ui-color-surface-inset", value: "surface inset" },
                { name: "--ui-color-border", value: "border" },
                { name: "--ui-color-border-strong", value: "border strong" },
                { name: "--ui-toggle-on", value: theme === "light" ? "#34a853" : "#4caf50" },
              ].map((token) => (
                <div className="catalog-token-swatch" key={token.name}>
                  <div
                    className="catalog-token-color"
                    style={{ background: `var(${token.name})` }}
                  />
                  <span className="catalog-token-name">{token.name}</span>
                  <span className="catalog-token-value">{token.value}</span>
                </div>
              ))}
            </div>
          </PreviewBox>
        </section>

        {/* BADGE */}
        <section className="catalog-section">
          <SectionHeader title="Badge" tag=".ui-badge" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="catalog-item">
                <span className="catalog-item-label">Light</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span className="ui-badge">MC</span>
                  <span className="ui-badge">MR</span>
                  <span className="ui-badge">MD</span>
                  <span className="ui-badge">CH</span>
                </div>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="catalog-item">
                <span className="catalog-item-label" style={{ color: "#a0a0a0" }}>Dark</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span className="ui-badge">MC</span>
                  <span className="ui-badge">MR</span>
                  <span className="ui-badge">MD</span>
                </div>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* TOGGLE */}
        <section className="catalog-section">
          <SectionHeader title="Toggle switch" tag=".ui-toggle" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="catalog-item">
                <span className="catalog-item-label">Off / On — Light</span>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <label className="ui-toggle">
                    <input
                      checked={toggleA}
                      onChange={() => setToggleA(!toggleA)}
                      type="checkbox"
                    />
                    <span />
                  </label>
                  <label className="ui-toggle">
                    <input
                      checked={toggleB}
                      onChange={() => setToggleB(!toggleB)}
                      type="checkbox"
                    />
                    <span />
                  </label>
                </div>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="catalog-item">
                <span className="catalog-item-label" style={{ color: "#a0a0a0" }}>Off / On — Dark</span>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <label className="ui-toggle">
                    <input type="checkbox" readOnly />
                    <span />
                  </label>
                  <label className="ui-toggle">
                    <input checked type="checkbox" readOnly />
                    <span />
                  </label>
                </div>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* CHECKBOX */}
        <section className="catalog-section">
          <SectionHeader title="Checkbox" tag=".ui-checkbox" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div style={{ display: "flex", gap: "1rem" }}>
                <label className="ui-checkbox">
                  <input
                    checked={checkA}
                    onChange={() => setCheckA(!checkA)}
                    type="checkbox"
                  />
                  <span />
                </label>
                <label className="ui-checkbox">
                  <input
                    checked={checkB}
                    onChange={() => setCheckB(!checkB)}
                    type="checkbox"
                  />
                  <span />
                </label>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div style={{ display: "flex", gap: "1rem" }}>
                <label className="ui-checkbox">
                  <input type="checkbox" readOnly />
                  <span />
                </label>
                <label className="ui-checkbox">
                  <input checked type="checkbox" readOnly />
                  <span />
                </label>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* LIST ROWS */}
        <section className="catalog-section">
          <SectionHeader title="List row · Label muted" tag=".ui-list-row · .ui-list-section · .ui-label-muted" />
          <div className="catalog-row">
            <PreviewBox theme="light" fullWidth>
              <div className="catalog-list-demo">
                <section className="ui-list-section">
                  <span className="ui-label-muted">IDIOMA</span>
                  <button className="ui-list-row ui-list-row-static" type="button">
                    <span className="ui-list-icon">L</span>
                    <span className="ui-list-label">Language</span>
                    <select style={{ border: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--ui-color-text-muted)" }}>
                      <option>Español</option>
                      <option>English</option>
                    </select>
                  </button>
                </section>
                <section className="ui-list-section">
                  <span className="ui-label-muted">TEMA</span>
                  <div className="ui-list-row ui-list-row-static">
                    <span className="ui-list-icon">☀</span>
                    <span className="ui-list-label">Modo Oscuro</span>
                    <label className="ui-toggle">
                      <input type="checkbox" readOnly />
                      <span />
                    </label>
                  </div>
                </section>
                <section className="ui-list-section">
                  <span className="ui-label-muted">AUDIO</span>
                  <button className="ui-list-row" type="button">
                    <span className="ui-list-icon">A</span>
                    <span className="ui-list-label">Salida de Audio</span>
                    <span className="ui-list-value">Dispositivo</span>
                    <span className="ui-list-arrow">›</span>
                  </button>
                  <button className="ui-list-row" type="button">
                    <span className="ui-list-icon">M</span>
                    <span className="ui-list-label">MIDI Dispositivo</span>
                    <span className="ui-list-value">No conectado</span>
                    <span className="ui-list-arrow">›</span>
                  </button>
                </section>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark" fullWidth>
              <div className="catalog-list-demo">
                <section className="ui-list-section">
                  <span className="ui-label-muted">PLUGIN</span>
                  <article className="ui-list-row ui-list-row-plugin">
                    <span className="ui-badge">MC</span>
                    <div className="ui-plugin-copy">
                      <strong>M Compressor</strong>
                      <span>v1.0.0 · Dynamics</span>
                    </div>
                    <label className="ui-checkbox">
                      <input checked type="checkbox" readOnly />
                      <span />
                    </label>
                    <span className="ui-list-arrow">›</span>
                  </article>
                  <article className="ui-list-row ui-list-row-plugin">
                    <span className="ui-badge">MR</span>
                    <div className="ui-plugin-copy">
                      <strong>M Reverb</strong>
                      <span>v1.2.3 · Reverb</span>
                    </div>
                    <label className="ui-checkbox">
                      <input type="checkbox" readOnly />
                      <span />
                    </label>
                    <span className="ui-list-arrow">›</span>
                  </article>
                </section>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* BOTONES */}
        <section className="catalog-section">
          <SectionHeader title="Botones" tag=".ui-pill-btn · .ui-icon-btn" />
          <div className="catalog-row">
            <PreviewBox theme={theme}>
              <div className="catalog-item">
                <span className="catalog-item-label" style={theme === "dark" ? { color: "#a0a0a0" } : {}}>
                  Pill button
                </span>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button className="ui-pill-btn" type="button">+ TRACK</button>
                  <button className="ui-pill-btn" type="button">VIBRATO LEAD</button>
                  <button className="ui-pill-btn ui-pill-btn-active" type="button">ACTIVE</button>
                  <button className="ui-pill-btn ui-pill-btn-accent" type="button">ACCENT</button>
                </div>
              </div>
            </PreviewBox>
            <PreviewBox theme={theme}>
              <div className="catalog-item">
                <span className="catalog-item-label" style={theme === "dark" ? { color: "#a0a0a0" } : {}}>
                  Icon button
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="ui-icon-btn" type="button">
                    <Maximize2 size={16} />
                  </button>
                  <button className="ui-icon-btn" type="button">
                    <Search size={16} />
                  </button>
                  <button className="ui-icon-btn" type="button">‹</button>
                  <button className="ui-icon-btn" type="button">›</button>
                </div>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* COUNTER */}
        <section className="catalog-section">
          <SectionHeader title="Counter / Stepper" tag=".ui-counter" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="catalog-item">
                <span className="catalog-item-label">OCT</span>
                <div className="ui-counter">
                  <button className="ui-counter-btn" type="button">−</button>
                  <span className="ui-counter-value">4</span>
                  <button className="ui-counter-btn" type="button">+</button>
                </div>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="catalog-item">
                <span className="catalog-item-label" style={{ color: "#a0a0a0" }}>BPM</span>
                <div className="ui-counter">
                  <button className="ui-counter-btn" type="button">−</button>
                  <span className="ui-counter-value">120</span>
                  <button className="ui-counter-btn" type="button">+</button>
                </div>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* TRACK PILL */}
        <section className="catalog-section">
          <SectionHeader title="Track pill" tag=".ui-track-pill" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="ui-track-pill">
                <button className="ui-icon-btn" type="button">‹</button>
                <span className="ui-track-pill-display">TRACK 1</span>
                <button className="ui-icon-btn" type="button">›</button>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="ui-track-pill">
                <button className="ui-icon-btn" type="button">‹</button>
                <span className="ui-track-pill-display">TRACK 2</span>
                <button className="ui-icon-btn" type="button">›</button>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* SELECT */}
        <section className="catalog-section">
          <SectionHeader title="Select" tag=".ui-select" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select className="ui-select">
                  <option>NOTAS</option>
                  <option>TRACKS</option>
                </select>
                <select className="ui-select">
                  <option>1 BAR</option>
                  <option>2 BARS</option>
                  <option>4 BARS</option>
                </select>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* SURFACE CARD */}
        <section className="catalog-section">
          <SectionHeader title="Surface card" tag=".ui-surface-card" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="ui-surface-card" style={{ display: "grid", gap: "0.5rem", minWidth: "12rem" }}>
                <span className="ui-label-muted">Sección</span>
                <span style={{ fontSize: "0.9rem", color: "var(--ui-color-text)" }}>Contenido de la tarjeta</span>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="ui-surface-card" style={{ display: "grid", gap: "0.5rem", minWidth: "12rem" }}>
                <span className="ui-label-muted">Sección</span>
                <span style={{ fontSize: "0.9rem", color: "var(--ui-color-text)" }}>Contenido de la tarjeta</span>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* RANGE INPUT */}
        <section className="catalog-section">
          <SectionHeader title="Range input" tag="input[type=range] · global" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="catalog-item">
                <span className="catalog-item-label">Volumen</span>
                <input defaultValue={70} max={100} min={0} style={{ width: "10rem" }} type="range" />
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="catalog-item">
                <span className="catalog-item-label" style={{ color: "#a0a0a0" }}>Volumen</span>
                <input defaultValue={40} max={100} min={0} style={{ width: "10rem" }} type="range" />
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* TOGGLE GROUP */}
        <section className="catalog-section">
          <SectionHeader title="Toggle group" tag=".ui-toggle-group" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="ui-toggle-group" role="group">
                <button aria-pressed={true} type="button">NOTAS</button>
                <button aria-pressed={false} type="button">TRACKS</button>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="ui-toggle-group" role="group">
                <button aria-pressed={false} type="button">NOTAS</button>
                <button aria-pressed={true} type="button">TRACKS</button>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* CHIP */}
        <section className="catalog-section">
          <SectionHeader title="Chip" tag=".ui-chip" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span className="ui-chip">Activo</span>
                <span className="ui-chip">Mute</span>
                <span className="ui-chip">MIDI</span>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span className="ui-chip">Activo</span>
                <span className="ui-chip">Solo</span>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* DIVIDER */}
        <section className="catalog-section">
          <SectionHeader title="Divider" tag=".ui-divider" />
          <div className="catalog-row">
            <PreviewBox theme="light" fullWidth>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="ui-label-muted">Sección A</span>
                <div className="ui-divider" />
                <span className="ui-label-muted">Sección B</span>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark" fullWidth>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="ui-label-muted">Sección A</span>
                <div className="ui-divider" />
                <span className="ui-label-muted">Sección B</span>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* EMPTY STATE */}
        <section className="catalog-section">
          <SectionHeader title="Empty state" tag=".ui-empty-state" />
          <div className="catalog-row">
            <PreviewBox theme="light">
              <div className="ui-empty-state" style={{ minWidth: "12rem" }}>
                <span>Sin muestras</span>
                <span style={{ fontSize: "0.78rem" }}>Importa un archivo de audio para comenzar</span>
              </div>
            </PreviewBox>
            <PreviewBox theme="dark">
              <div className="ui-empty-state" style={{ minWidth: "12rem" }}>
                <span>Sin notas</span>
                <span style={{ fontSize: "0.78rem" }}>Graba para ver las notas aquí</span>
              </div>
            </PreviewBox>
          </div>
        </section>

        {/* ICONS */}
        <section className="catalog-section">
          <SectionHeader title="Iconos — Lucide React" tag="lucide-react · MIT License" />
          <PreviewBox theme={theme} fullWidth>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", padding: "0.5rem 0" }}>
              {[
                { icon: <Piano size={20} />, label: "Piano" },
                { icon: <Grid2x2 size={20} />, label: "Grid2x2" },
                { icon: <AudioWaveform size={20} />, label: "AudioWaveform" },
                { icon: <Plug size={20} />, label: "Plug" },
                { icon: <Settings size={20} />, label: "Settings" },
                { icon: <Trash2 size={20} />, label: "Trash2" },
                { icon: <ArrowLeft size={20} />, label: "ArrowLeft" },
                { icon: <Search size={20} />, label: "Search" },
                { icon: <Upload size={20} />, label: "Upload" },
                { icon: <Folder size={20} />, label: "Folder" },
                { icon: <MoreVertical size={20} />, label: "MoreVertical" },
                { icon: <Maximize2 size={20} />, label: "Maximize2" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                  {icon}
                  <span style={{ fontSize: "0.6rem", opacity: 0.5, letterSpacing: "0.04em" }}>{label}</span>
                </div>
              ))}
            </div>
          </PreviewBox>
        </section>

        {/* TOOLBAR DE VISTA — PLANTILLA */}
        <section className="catalog-section">
          <SectionHeader title="View toolbar — plantilla" tag=".app-mock-toolbar · .app-mock-toolbar-controls" />
          <p style={{ fontSize: "0.75rem", color: "var(--app-color-text-muted)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
            Regla: toda vista tiene <strong>una sola línea</strong> de controles en <code>.app-mock-toolbar-controls</code>.
            Los controles se ponen en orden: <em>modo switch → selector de entidad → parámetros → acción</em>.
            Nunca usar <code>flex-wrap</code> en la toolbar de controles.
          </p>
          <div className="catalog-row" style={{ width: "100%" }}>
            <PreviewBox theme={theme} fullWidth>
              <header className="app-mock-toolbar">
                <div className="app-mock-toolbar-controls">
                  <div className="ui-toggle-group" role="group">
                    <button aria-pressed={true} type="button">NOTAS</button>
                    <button aria-pressed={false} type="button">TRACKS</button>
                  </div>
                  <select className="ui-select" defaultValue="track1">
                    <option value="track1">TRACK 1</option>
                    <option value="track2">TRACK 2</option>
                  </select>
                  <select className="ui-select" defaultValue="1bar">
                    <option value="1bar">1 BAR</option>
                    <option value="2bars">2 BARS</option>
                    <option value="4bars">4 BARS</option>
                  </select>
                  <button className="perform-mode-transport-button perform-mode-transport-play" type="button">
                    <Play size={14} />
                  </button>
                </div>
              </header>
            </PreviewBox>
          </div>
        </section>

        {/* SMC PAD */}
        <section className="catalog-section">
          <SectionHeader title="SMC Pad grid" tag=".ui-smc-grid · .ui-smc-btn" />
          <PreviewBox theme={theme} fullWidth>
            <div className="ui-smc-grid catalog-smc-demo">
              <button className="ui-smc-btn ui-smc-btn-kick" type="button">
                <span className="ui-smc-btn-num">1</span>
                <span className="ui-smc-btn-label">Kick</span>
                <span className="ui-smc-btn-desc">Golpe grave</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-snare" type="button">
                <span className="ui-smc-btn-num">2</span>
                <span className="ui-smc-btn-label">Snare</span>
                <span className="ui-smc-btn-desc">Crack medio</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-hat" type="button">
                <span className="ui-smc-btn-num">3</span>
                <span className="ui-smc-btn-label">HiHat</span>
                <span className="ui-smc-btn-desc">Chispa cerrada</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-clap" type="button">
                <span className="ui-smc-btn-num">4</span>
                <span className="ui-smc-btn-label">Clap</span>
                <span className="ui-smc-btn-desc">Tres ráfagas</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-perc" type="button">
                <span className="ui-smc-btn-num">5</span>
                <span className="ui-smc-btn-label">Perc 1</span>
                <span className="ui-smc-btn-desc">Percusión extra</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-perc" type="button">
                <span className="ui-smc-btn-num">6</span>
                <span className="ui-smc-btn-label">Perc 2</span>
                <span className="ui-smc-btn-desc">—</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-perc" type="button">
                <span className="ui-smc-btn-num">7</span>
                <span className="ui-smc-btn-label">Perc 3</span>
                <span className="ui-smc-btn-desc">—</span>
              </button>
              <button className="ui-smc-btn ui-smc-btn-perc" type="button">
                <span className="ui-smc-btn-num">8</span>
                <span className="ui-smc-btn-label">Perc 4</span>
                <span className="ui-smc-btn-desc">—</span>
              </button>
            </div>
          </PreviewBox>
        </section>

        {/* ── Dialog / Modal ── */}
        <section className="catalog-section">
          <SectionHeader title="Dialog estándar" tag=".app-dialog" />
          <PreviewBox theme={theme} fullWidth>
            <div style={{ position: "relative", minHeight: "14rem", display: "grid", placeItems: "center" }}>
              <div className="app-dialog" style={{ position: "relative", zIndex: 1 }}>
                <div className="app-dialog-copy">
                  <strong>¿Eliminar Track 2?</strong>
                  <p>La pista activa y sus notas se eliminarán de esta toma.</p>
                </div>
                <div className="app-dialog-actions">
                  <button type="button">Cancelar</button>
                  <button className="app-dialog-confirm" type="button">Eliminar</button>
                </div>
              </div>
            </div>
          </PreviewBox>
        </section>

        <section className="catalog-section">
          <SectionHeader title="Dialog de aviso" tag=".app-dialog · advertencia" />
          <PreviewBox theme={theme} fullWidth>
            <div style={{ position: "relative", minHeight: "14rem", display: "grid", placeItems: "center" }}>
              <div className="app-dialog" style={{ position: "relative", zIndex: 1 }}>
                <div className="app-dialog-copy">
                  <strong>¿Reiniciar proyecto?</strong>
                  <p>Solo queda una pista. El proyecto se reiniciará desde cero y perderás las notas grabadas.</p>
                </div>
                <div className="app-dialog-actions">
                  <button type="button">Cancelar</button>
                  <button className="app-dialog-confirm" type="button">Reiniciar</button>
                </div>
              </div>
            </div>
          </PreviewBox>
        </section>

        <section className="catalog-section">
          <SectionHeader title="Dialog selector de instrumentos" tag=".perform-instrument-dialog-v" />
          <PreviewBox theme={theme} fullWidth>
            <div style={{ position: "relative", minHeight: "22rem", display: "grid", placeItems: "center" }}>
              <div className="app-dialog" style={{ position: "relative", zIndex: 1, width: "min(100%, 22rem)" }}>
                <div className="app-dialog-copy">
                  <strong>Instrumentos</strong>
                  <p>Selecciona el tipo y el instrumento.</p>
                </div>
                <div className="perform-instrument-dialog-v">
                  <div className="perform-instrument-dialog-section">
                    <span className="perform-instrument-dialog-title">Tipo</span>
                    <div className="perform-instrument-dialog-tabs">
                      <button className="ui-pill-btn ui-pill-btn-active" type="button">Base</button>
                      <button className="ui-pill-btn" type="button">Avanzado</button>
                    </div>
                    <p className="perform-instrument-dialog-note">Sonidos fundamentales y estables.</p>
                  </div>
                  <div className="perform-instrument-dialog-section">
                    <span className="perform-instrument-dialog-title">Instrumentos</span>
                    <div className="perform-instrument-dialog-list">
                      <button className="mode-switch-active" type="button">Bright Square</button>
                      <button type="button">Soft Sine</button>
                      <button type="button">Warm Saw</button>
                    </div>
                  </div>
                </div>
                <div className="app-dialog-actions">
                  <button type="button">Cerrar</button>
                </div>
              </div>
            </div>
          </PreviewBox>
        </section>

      </div>
    </main>
  )
}
