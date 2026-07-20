import { useState } from "react"
import {
  OSCILLATOR_PRESETS,
  OSCILLATOR_WAVEFORMS,
  getOscillatorInstrumentId,
  getOscillatorPreset,
  normalizeOscillatorSettings,
  type OscillatorMotionMode,
  type OscillatorMotionShape,
  type OscillatorPresetId,
  type OscillatorSettings,
  type OscillatorWaveform,
} from "./oscillatorModel"
import {
  loadOscillatorSettings,
  saveOscillatorSettings,
} from "./oscillatorSettingsStore"

type PluginAPI = {
  audio: {
    playNote(note: string, instrumentId: string, duration: number): void
    stopNote(note: string): void
  }
  project: { getBPM(): number }
  session: { sendOutput(output: unknown): void }
  ui: { notify(message: string): void }
}

const PRESET_LABELS: Record<OscillatorPresetId, string> = {
  warm: "Warm",
  pluck: "Pluck",
  pulse: "Pulse",
  bright: "Bright",
}

const WAVE_LABELS: Record<OscillatorWaveform, string> = {
  sine: "Sine",
  square: "Square",
  sawtooth: "Saw",
  triangle: "Triangle",
}

const MOTION_MODES: { id: OscillatorMotionMode; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "vibrato", label: "Vibrato" },
  { id: "tremolo", label: "Tremolo" },
]

const MOTION_SHAPES: { id: OscillatorMotionShape; label: string }[] = [
  { id: "smooth", label: "Smooth" },
  { id: "step", label: "Step" },
  { id: "ramp", label: "Ramp" },
  { id: "bounce", label: "Bounce" },
]

const WAVE_PATHS: Record<OscillatorWaveform, string> = {
  sine: "M 14 70 C 42 14, 70 14, 98 70 S 154 126, 182 70",
  square: "M 14 96 H 44 V 42 H 98 V 96 H 152 V 42 H 182",
  sawtooth: "M 14 96 L 70 42 V 96 L 126 42 V 96 L 182 42",
  triangle: "M 14 96 L 56 42 L 98 96 L 140 42 L 182 96",
}

export function OscillatorWorkspace({
  api,
  version,
}: {
  api: PluginAPI
  language?: string
  version?: string
}) {
  const [settings, setSettings] = useState<OscillatorSettings>(() =>
    loadOscillatorSettings(),
  )
  const instrumentId = getOscillatorInstrumentId()

  function patchSettings(patch: Partial<OscillatorSettings>) {
    setSettings((current) =>
      saveOscillatorSettings(normalizeOscillatorSettings({ ...current, ...patch })),
    )
  }

  function loadPreset(id: OscillatorPresetId) {
    setSettings(saveOscillatorSettings(getOscillatorPreset(id)))
  }

  function preview() {
    api.audio.playNote("C4", instrumentId, 0.8)
  }

  return (
    <div className="osc-workspace" data-e2e="oscillator-workspace">
      <header className="osc-header">
        <div>
          <span className="osc-kicker">Signal Lab</span>
          <h1>Oscillator</h1>
        </div>
        <div className="osc-header-meta">
          <span>{settings.waveform}</span>
          {version && <span>v{version}</span>}
        </div>
      </header>

      <main className="osc-main">
        <section className="osc-scope-panel" aria-label="Oscilloscope">
          <div className="osc-scope osc-scope-wide">
            <svg viewBox="0 0 196 140" aria-hidden="true">
              <defs>
                <radialGradient id="osc-scope-glow" cx="50%" cy="48%" r="58%">
                  <stop offset="0%" stopColor="rgba(92, 224, 184, 0.22)" />
                  <stop offset="72%" stopColor="rgba(92, 224, 184, 0.045)" />
                  <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
                </radialGradient>
              </defs>
              <rect className="osc-scope-fill" x="8" y="18" width="180" height="104" rx="10" />
              <path className="osc-grid" d="M 16 70 H 180 M 98 22 V 118 M 52 22 V 118 M 144 22 V 118 M 16 44 H 180 M 16 96 H 180" />
              <path className="osc-wave-shadow" d={WAVE_PATHS[settings.waveform]} />
              <path className="osc-wave-line" d={WAVE_PATHS[settings.waveform]} />
            </svg>
            <div className="osc-scope-readout">
              <span>C4</span>
              <strong>{WAVE_LABELS[settings.waveform]}</strong>
            </div>
          </div>
        </section>

        <section className="osc-control-panel" aria-label="Oscillator controls">
          <div className="osc-control-scroll">
            <div className="osc-block osc-block-inline">
              <span className="osc-label">Character</span>
              <select
                className="osc-select"
                data-e2e="oscillator-character"
                value=""
                onChange={(event) => {
                  if (event.target.value) loadPreset(event.target.value as OscillatorPresetId)
                }}
              >
                <option value="">Custom / choose character</option>
                {(Object.keys(OSCILLATOR_PRESETS) as OscillatorPresetId[]).map((id) => (
                  <option key={id} value={id}>{PRESET_LABELS[id]}</option>
                ))}
              </select>
            </div>

            <div className="osc-block">
              <span className="osc-label">Wave</span>
              <div className="osc-segment" data-e2e="oscillator-wave-controls">
                {OSCILLATOR_WAVEFORMS.map((waveform) => (
                  <button
                    key={waveform}
                    className={settings.waveform === waveform ? "active" : ""}
                    data-e2e={`oscillator-wave-${waveform}`}
                    type="button"
                    onClick={() => patchSettings({ waveform })}
                  >
                    {WAVE_LABELS[waveform]}
                  </button>
                ))}
              </div>
            </div>

            <div className="osc-block">
              <span className="osc-label">Motion</span>
              <div className="osc-segment osc-segment-three">
                {MOTION_MODES.map((motion) => (
                  <button
                    key={motion.id}
                    className={settings.motionMode === motion.id ? "active" : ""}
                    data-e2e={`oscillator-motion-${motion.id}`}
                    type="button"
                    onClick={() => patchSettings({ motionMode: motion.id })}
                  >
                    {motion.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="osc-block">
              <span className="osc-label">Motion Shape</span>
              <div className="osc-segment" data-e2e="oscillator-motion-shape-controls">
                {MOTION_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    className={settings.motionShape === shape.id ? "active" : ""}
                    data-e2e={`oscillator-motion-shape-${shape.id}`}
                    type="button"
                    onClick={() => patchSettings({ motionShape: shape.id })}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="osc-motion-grid">
              <label className="osc-slider">
                <span>Rate</span>
                <input
                  max={18}
                  min={0.1}
                  step={0.1}
                  type="range"
                  value={settings.motionRate}
                  onChange={(event) => patchSettings({ motionRate: Number(event.target.value) })}
                />
                <strong>{settings.motionRate.toFixed(1)}</strong>
              </label>
              <label className="osc-slider">
                <span>Depth</span>
                <input
                  max={1}
                  min={0}
                  step={0.01}
                  type="range"
                  value={settings.motionDepth}
                  onChange={(event) => patchSettings({ motionDepth: Number(event.target.value) })}
                />
                <strong>{Math.round(settings.motionDepth * 100)}%</strong>
              </label>
            </div>

            {/* Envelope is intentionally not exposed yet: Piano currently applies
                the active track envelope over the instrument envelope. Re-enable
                these controls after the core supports plugin/instrument envelope
                as a selectable playback source. */}
          </div>
        </section>
      </main>

      <footer className="osc-actions">
        <div className="osc-actions-copy">
          <span>Instrument</span>
          <strong>
            Oscillator - {WAVE_LABELS[settings.waveform]} - {settings.motionMode} - {settings.motionShape}
          </strong>
        </div>
        <div className="osc-actions-buttons">
          <button data-e2e="oscillator-preview" type="button" onClick={preview}>
            Preview
          </button>
        </div>
      </footer>
    </div>
  )
}
