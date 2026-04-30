import type {
  ArpeggiatorMode,
  ArpeggiatorRate,
  ArpeggiatorSettings,
} from "../../engine/midi/arpeggiator"
import type { MusicalNote, Octave } from "../../engine/midi/notes"
import type { PianoInteractionMode } from "../piano/PianoPreview"

type ChordType = "major" | "minor" | "power"

type LabSoundControlsProps = {
  arpeggiatorSettings: ArpeggiatorSettings
  availableNotes: MusicalNote[]
  onArpeggiatorEnabledChange: (enabled: boolean) => void
  onArpeggiatorGateChange: (gate: number) => void
  onArpeggiatorLatchChange: (latch: boolean) => void
  onArpeggiatorModeChange: (mode: ArpeggiatorMode) => void
  onArpeggiatorOctaveRangeChange: (octaveRange: number) => void
  onArpeggiatorRateChange: (rate: ArpeggiatorRate) => void
  onChordTypeChange: (chordType: ChordType) => void
  onNoteChange: (note: MusicalNote) => void
  onPreviewOctaveChange: (octave: Octave) => void
  onPianoModeChange: (mode: PianoInteractionMode) => void
  onVolumeChange: (volume: number) => void
  pianoMode: PianoInteractionMode
  previewOctave: Octave
  previewOctaveOptions: Octave[]
  selectedChordType: ChordType
  selectedNote: MusicalNote
  volume: number
}

export function LabSoundControls({
  arpeggiatorSettings,
  availableNotes,
  onArpeggiatorEnabledChange,
  onArpeggiatorGateChange,
  onArpeggiatorLatchChange,
  onArpeggiatorModeChange,
  onArpeggiatorOctaveRangeChange,
  onArpeggiatorRateChange,
  onChordTypeChange,
  onNoteChange,
  onPreviewOctaveChange,
  onPianoModeChange,
  onVolumeChange,
  pianoMode,
  previewOctave,
  previewOctaveOptions,
  selectedChordType,
  selectedNote,
  volume,
}: LabSoundControlsProps) {
  return (
    <>
      <div className="control-group">
        <label>Modo del piano</label>
        <div className="mode-switch" aria-label="Modo del piano">
          <button
            className={pianoMode === "note" ? "mode-switch-active" : ""}
            onClick={() => onPianoModeChange("note")}
            type="button"
          >
            Nota
          </button>
          <button
            className={pianoMode === "chord" ? "mode-switch-active" : ""}
            onClick={() => onPianoModeChange("chord")}
            type="button"
          >
            Acorde
          </button>
        </div>
      </div>

      <div className="control-group">
        <label htmlFor="preview-octave">Octava visible</label>
        <select
          id="preview-octave"
          value={previewOctave}
          onChange={(event) => onPreviewOctaveChange(Number(event.target.value) as Octave)}
        >
          {previewOctaveOptions.map((octave) => (
            <option key={octave} value={octave}>
              C{octave} - C{octave + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="note">Nota musical</label>
        <select
          id="note"
          value={selectedNote}
          onChange={(event) => onNoteChange(event.target.value as MusicalNote)}
        >
          {availableNotes.map((note) => (
            <option key={note} value={note}>
              {note}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="chord-type">Tipo de acorde</label>
        <select
          id="chord-type"
          value={selectedChordType}
          onChange={(event) => onChordTypeChange(event.target.value as ChordType)}
        >
          <option value="major">Mayor</option>
          <option value="minor">Menor</option>
          <option value="power">Power</option>
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="volume">Volumen maestro</label>
        <input
          id="volume"
          max="1"
          min="0"
          step="0.01"
          type="range"
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
      </div>

      <section className="track-automation" aria-label="Arpegiador del laboratorio">
        <div className="track-mix-header">
          <h2>Arpegiador</h2>
          <label className="timeline-snap-toggle" htmlFor="arpeggiator-enabled">
            <input
              checked={arpeggiatorSettings.enabled}
              id="arpeggiator-enabled"
              onChange={(event) => onArpeggiatorEnabledChange(event.target.checked)}
              type="checkbox"
            />
            Activar
          </label>
        </div>
        <p className="project-message">
          Convierte nota o acorde en patron ritmico grabable como notas reales.
        </p>
        <div className="track-envelope-grid">
          <div className="control-group">
            <label htmlFor="arpeggiator-mode">Modo</label>
            <select
              id="arpeggiator-mode"
              value={arpeggiatorSettings.mode}
              onChange={(event) =>
                onArpeggiatorModeChange(event.target.value as ArpeggiatorMode)
              }
            >
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="up-down">Up/Down</option>
              <option value="random">Random</option>
              <option value="chord">Chord</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="arpeggiator-rate">Rate</label>
            <select
              id="arpeggiator-rate"
              value={arpeggiatorSettings.rate}
              onChange={(event) =>
                onArpeggiatorRateChange(event.target.value as ArpeggiatorRate)
              }
            >
              <option value="1/4">1/4</option>
              <option value="1/8">1/8</option>
              <option value="1/16">1/16</option>
              <option value="1/8T">1/8T</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="arpeggiator-gate">Gate</label>
            <input
              id="arpeggiator-gate"
              max="1"
              min="0.2"
              step="0.01"
              type="number"
              value={arpeggiatorSettings.gate}
              onChange={(event) => onArpeggiatorGateChange(Number(event.target.value))}
            />
          </div>
          <div className="control-group">
            <label htmlFor="arpeggiator-octave-range">Octave range</label>
            <select
              id="arpeggiator-octave-range"
              value={arpeggiatorSettings.octaveRange}
              onChange={(event) =>
                onArpeggiatorOctaveRangeChange(Number(event.target.value))
              }
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>
        <label className="timeline-snap-toggle" htmlFor="arpeggiator-latch">
          <input
            checked={arpeggiatorSettings.latch}
            id="arpeggiator-latch"
            onChange={(event) => onArpeggiatorLatchChange(event.target.checked)}
            type="checkbox"
          />
          Latch
        </label>
      </section>
    </>
  )
}
