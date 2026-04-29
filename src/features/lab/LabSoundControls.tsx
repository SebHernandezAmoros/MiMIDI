import type { MusicalNote } from "../../engine/midi/notes"
import type { PianoInteractionMode } from "../piano/PianoPreview"

type ChordType = "major" | "minor" | "power"

type LabSoundControlsProps = {
  availableNotes: MusicalNote[]
  onChordTypeChange: (chordType: ChordType) => void
  onNoteChange: (note: MusicalNote) => void
  onPianoModeChange: (mode: PianoInteractionMode) => void
  onVolumeChange: (volume: number) => void
  pianoMode: PianoInteractionMode
  selectedChordType: ChordType
  selectedNote: MusicalNote
  volume: number
}

export function LabSoundControls({
  availableNotes,
  onChordTypeChange,
  onNoteChange,
  onPianoModeChange,
  onVolumeChange,
  pianoMode,
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
    </>
  )
}
