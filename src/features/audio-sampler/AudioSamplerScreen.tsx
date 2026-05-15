import { useState } from "react"
import "./AudioSamplerScreen.css"
import { Mic, Play, Square, Trash2, Upload, Scissors, RotateCcw } from "lucide-react"
import { AppDialog } from "../../app/components/AppDialog"
import type { AppViewMessages } from "../../app/appI18n"

type AudioSamplerScreenProps = {
  copy: AppViewMessages
  settingsOpen: boolean
  onSettingsClose: () => void
}

type SampleSlot = {
  id: number
  label: string
  duration: string | null
}

const SAMPLE_SLOTS: SampleSlot[] = [
  { id: 1, label: "Sample 1", duration: null },
  { id: 2, label: "Sample 2", duration: null },
  { id: 3, label: "Sample 3", duration: null },
  { id: 4, label: "Sample 4", duration: null },
  { id: 5, label: "Sample 5", duration: null },
  { id: 6, label: "Sample 6", duration: null },
  { id: 7, label: "Sample 7", duration: null },
  { id: 8, label: "Sample 8", duration: null },
]

export function AudioSamplerScreen({ copy, settingsOpen, onSettingsClose }: AudioSamplerScreenProps) {
  void copy
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<number>(1)

  return (
    <>
      <section className="app-mock-screen" aria-label="Sampler de audio">

        {/* Toolbar principal */}
        <header className="app-mock-toolbar">
          <div className="app-mock-toolbar-controls">
            {/* Transporte */}
            <button
              aria-label={isRecording ? "Detener grabación" : "Grabar"}
              className={`ui-icon-btn${isRecording ? " audio-sampler-btn-recording" : ""}`}
              onClick={() => setIsRecording((v) => !v)}
              title={isRecording ? "Detener" : "Grabar"}
              type="button"
            >
              <Mic size={18} />
            </button>
            <button
              aria-label={isPlaying ? "Detener" : "Reproducir"}
              className="ui-icon-btn"
              onClick={() => setIsPlaying((v) => !v)}
              title={isPlaying ? "Detener" : "Reproducir"}
              type="button"
            >
              {isPlaying ? <Square size={18} /> : <Play size={18} />}
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Acciones de slot */}
            <button className="ui-icon-btn" title="Importar audio" type="button">
              <Upload size={18} />
            </button>
            <button className="ui-icon-btn" title="Recortar" type="button">
              <Scissors size={18} />
            </button>
            <button className="ui-icon-btn" title="Revertir" type="button">
              <RotateCcw size={18} />
            </button>
            <button className="ui-icon-btn" title="Eliminar sample" type="button">
              <Trash2 size={18} />
            </button>

            <span aria-hidden="true" className="perform-mode-transport-divider" />

            {/* Info del slot activo */}
            <span className="audio-sampler-slot-label">
              Slot {selectedSlot}
            </span>
          </div>
        </header>

        {/* Área de waveform — mockup */}
        <div className="audio-sampler-waveform-area" aria-label="Vista de forma de onda">
          <div className="audio-sampler-waveform-empty">
            <Mic size={32} />
            <span>Sin audio grabado</span>
            <span className="audio-sampler-waveform-hint">
              Pulsa grabar o importa un archivo de audio
            </span>
          </div>
        </div>

        {/* Grid de slots */}
        <div className="audio-sampler-slots" aria-label="Slots de samples">
          {SAMPLE_SLOTS.map((slot) => (
            <button
              key={slot.id}
              aria-label={`${slot.label}${slot.duration ? ` — ${slot.duration}` : " — vacío"}`}
              aria-pressed={selectedSlot === slot.id}
              className={`audio-sampler-slot${selectedSlot === slot.id ? " audio-sampler-slot-active" : ""}`}
              onClick={() => setSelectedSlot(slot.id)}
              type="button"
            >
              <span className="audio-sampler-slot-num">{slot.id}</span>
              <span className="audio-sampler-slot-name">{slot.label}</span>
              {slot.duration
                ? <span className="audio-sampler-slot-duration">{slot.duration}</span>
                : <span className="audio-sampler-slot-empty">—</span>
              }
            </button>
          ))}
        </div>
      </section>

      {/* Modal de opciones extra */}
      <AppDialog
        description="Ajusta los parámetros de grabación y procesado del sampler."
        onClose={onSettingsClose}
        open={settingsOpen}
        title="Opciones — Sampler"
      >
        <div className="audio-sampler-settings">
          <section className="ui-list-section">
            <span className="ui-list-section-title">GRABACIÓN</span>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">M</span>
              <span className="ui-list-label">Entrada de micrófono</span>
              <span className="ui-list-value">Default</span>
            </div>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">Q</span>
              <span className="ui-list-label">Calidad</span>
              <span className="ui-list-value">44.1 kHz</span>
            </div>
          </section>
          <section className="ui-list-section">
            <span className="ui-list-section-title">PROCESADO</span>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">N</span>
              <span className="ui-list-label">Normalizar al importar</span>
              <label className="ui-toggle" aria-label="Normalizar">
                <input type="checkbox" defaultChecked />
                <span />
              </label>
            </div>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">T</span>
              <span className="ui-list-label">Recorte automático de silencio</span>
              <label className="ui-toggle" aria-label="Recorte de silencio">
                <input type="checkbox" />
                <span />
              </label>
            </div>
          </section>
          <section className="ui-list-section">
            <span className="ui-list-section-title">SLOTS</span>
            <div className="ui-list-row ui-list-row-static">
              <span className="ui-list-icon">S</span>
              <span className="ui-list-label">Número de slots</span>
              <span className="ui-list-value">8</span>
            </div>
          </section>
        </div>
      </AppDialog>
    </>
  )
}
