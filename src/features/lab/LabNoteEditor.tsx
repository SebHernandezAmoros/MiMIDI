import { isSmcPadRecordedNote, type MidiRecordedNote } from "../../engine/midi/events"

type LabNoteEditorProps = {
  onDuplicateSelectedNote: () => void
  onRevertSelectedNote: () => void
  onSelectedNoteDurationChange: (value: number) => void
  onSelectedNoteStartTimeChange: (value: number) => void
  selectedNoteHistoryStatus: "modificada" | "sin-cambios" | null
  selectedRecordedNote: MidiRecordedNote | null
}

export function LabNoteEditor({
  onDuplicateSelectedNote,
  onRevertSelectedNote,
  onSelectedNoteDurationChange,
  onSelectedNoteStartTimeChange,
  selectedNoteHistoryStatus,
  selectedRecordedNote,
}: LabNoteEditorProps) {
  if (selectedRecordedNote === null) {
    return null
  }

  const isDurationLocked = isSmcPadRecordedNote(selectedRecordedNote)

  return (
    <section className="note-editor" aria-label="Editar nota seleccionada">
      <div className="note-editor-grid">
        <div>
          <span className="project-label">Nota</span>
          <strong>{selectedRecordedNote.note}</strong>
          {selectedNoteHistoryStatus ? (
            <span
              className={`history-note-status history-note-status-${selectedNoteHistoryStatus}`}
            >
              {selectedNoteHistoryStatus === "modificada" ? "modificada" : "sin cambios"}
            </span>
          ) : null}
        </div>
        <div className="control-group">
          <label htmlFor="note-start-time">Inicio (s)</label>
          <input
            id="note-start-time"
            min="0"
            step="0.01"
            type="number"
            value={selectedRecordedNote.startTime.toFixed(2)}
            onChange={(event) =>
              onSelectedNoteStartTimeChange(Number(event.target.value))
            }
          />
        </div>
        <div className="control-group">
          <label htmlFor="note-duration">Duracion (s)</label>
          <input
            disabled={isDurationLocked}
            id="note-duration"
            min="0.01"
            step="0.01"
            type="number"
            value={selectedRecordedNote.duration.toFixed(2)}
            onChange={(event) =>
              onSelectedNoteDurationChange(Number(event.target.value))
            }
          />
          {isDurationLocked ? (
            <span className="project-label">
              Los golpes SMC Pad se pueden mover, pero no redimensionar.
            </span>
          ) : null}
        </div>
        <div className="control-group">
          <button disabled={!selectedRecordedNote} onClick={onDuplicateSelectedNote} type="button">
            Duplicar nota
          </button>
          <button
            disabled={!selectedRecordedNote}
            onClick={onRevertSelectedNote}
            title="Vuelve la nota seleccionada a su ultimo estado confirmado en historial."
            type="button"
          >
            Revertir nota
          </button>
        </div>
      </div>
    </section>
  )
}
