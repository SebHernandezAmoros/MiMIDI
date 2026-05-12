import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import {
  playSmcPadHit,
  type SmcPadSoundId,
} from "../../application/use-cases/playSmcPadHit"
import { AppDialog } from "../../app/components/AppDialog"
import type { AppViewMessages } from "../../app/appI18n"

type SamplerScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

type PadDescriptor = {
  accent: string
  btnClass: string
  desc: string
  id: SmcPadSoundId | null
  label: string
  num: number
}

const pads: PadDescriptor[] = [
  { num: 1, id: "kick",  label: "Kick",   desc: "Golpe grave",      accent: "#c95d54", btnClass: "ui-smc-btn-kick"  },
  { num: 2, id: "snare", label: "Snare",  desc: "Crack medio",      accent: "#d2a255", btnClass: "ui-smc-btn-snare" },
  { num: 3, id: "hat",   label: "Hihat",  desc: "Chispa brillante", accent: "#88b06b", btnClass: "ui-smc-btn-hat"   },
  { num: 4, id: "clap",  label: "Clap",   desc: "Tres ráfagas",     accent: "#5ba3b9", btnClass: "ui-smc-btn-clap"  },
  { num: 5, id: null, label: "Perc 1", desc: "—", accent: "", btnClass: "ui-smc-btn-perc" },
  { num: 6, id: null, label: "Perc 2", desc: "—", accent: "", btnClass: "ui-smc-btn-perc" },
  { num: 7, id: null, label: "Perc 3", desc: "—", accent: "", btnClass: "ui-smc-btn-perc" },
  { num: 8, id: null, label: "Perc 4", desc: "—", accent: "", btnClass: "ui-smc-btn-perc" },
]

export function SamplerScreen({ copy, settingsOpen, onSettingsClose }: SamplerScreenProps) {
  void copy
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  function triggerPad(pad: PadDescriptor) {
    if (!pad.id) return
    playSmcPadHit(pad.id)
    setActiveId(pad.id)
    window.setTimeout(() => setActiveId(null), 140)
  }

  return (
    <>
    <section className="app-mock-screen" aria-label="Workspace SMC Pad">
      <header className="app-mock-toolbar">
        <div className="perform-mode-transport" aria-label="Controles de grabacion">
          <button
            aria-label={isRecording ? "Detener grabacion" : "Iniciar grabacion"}
            className={`perform-mode-transport-button ${isRecording ? "perform-mode-transport-button-active" : "perform-mode-transport-record"}`}
            onClick={() => { setIsRecording((r) => !r); setIsPlaying(false) }}
            type="button"
          >
            <span className="perform-mode-transport-icon">
              <span className={`perform-mode-transport-glyph ${isRecording ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-record"}`}>
                {isRecording ? "■" : "●"}
              </span>
            </span>
          </button>
          <button
            aria-label={isPlaying ? "Detener reproduccion" : "Reproducir"}
            className={`perform-mode-transport-button ${isPlaying ? "perform-mode-transport-button-active" : "perform-mode-transport-play"}`}
            disabled={isRecording}
            onClick={() => setIsPlaying((p) => !p)}
            type="button"
          >
            <span className="perform-mode-transport-icon">
              <span className={`perform-mode-transport-glyph ${isPlaying ? "perform-mode-transport-glyph-stop" : "perform-mode-transport-glyph-play"}`}>
                {isPlaying ? "■" : "▶"}
              </span>
            </span>
          </button>
        </div>
        <div className="app-mock-toolbar-controls">
          <select aria-label="Modo de pad" className="ui-select">
            <option>STANDARD</option>
            <option>LATIN</option>
            <option>ELECTRONIC</option>
          </select>
          <select aria-label="Afinación" className="ui-select">
            <option>TUNE</option>
            <option>+1</option>
            <option>-1</option>
          </select>
        </div>
        <button
          aria-label="Volver"
          className="ui-icon-btn"
          style={{ marginLeft: "auto" }}
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
      </header>

      <div className="ui-smc-grid">
        {pads.map((pad) => (
          <button
            aria-label={pad.id ? `${pad.label} — pulsar pad` : `${pad.label} — próximamente`}
            className={[
              "ui-smc-btn",
              pad.btnClass,
              activeId === pad.id ? "ui-smc-btn-triggered" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={pad.id === null}
            key={pad.num}
            onClick={() => triggerPad(pad)}
            type="button"
          >
            <span className="ui-smc-btn-num">{pad.num}</span>
            <span className="ui-smc-btn-label">{pad.label}</span>
            <span className="ui-smc-btn-desc">{pad.desc}</span>
          </button>
        ))}
      </div>
    </section>

    <AppDialog
      description="Configuración del SMC Pad."
      onClose={onSettingsClose}
      open={settingsOpen}
      title="Opciones — SMC Pad"
    />
    </>
  )
}
