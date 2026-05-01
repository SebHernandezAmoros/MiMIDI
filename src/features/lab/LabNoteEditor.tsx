import { isSmcPadRecordedNote, type MidiRecordedNote } from "../../engine/midi/events"

type LabNoteEditorProps = {
  canRedo: boolean
  canUndo: boolean
  historyLimit: number
  isTimelineDragging: boolean
  noteTimelineDuration: number
  onCompactNoteTimelineStart: () => void
  onDuplicateSelectedNote: () => void
  onRedo: () => void
  onResetNoteTimelineDuration: () => void
  onRevertSelectedNote: () => void
  onSelectedNoteDurationChange: (value: number) => void
  onSelectedNoteStartTimeChange: (value: number) => void
  onNoteTimelineDurationChange: (value: number) => void
  onToggleTimelineSnap: (enabled: boolean) => void
  onTimelineSnapStepChange: (step: number) => void
  onUndo: () => void
  redoCount: number
  selectedNoteHistoryStatus: "modificada" | "sin-cambios" | null
  selectedRecordedNote: MidiRecordedNote | null
  shortcutHint: string
  timelineSnapEnabled: boolean
  timelineSnapStep: number
  undoCount: number
}

export function LabNoteEditor({
  canRedo,
  canUndo,
  historyLimit,
  isTimelineDragging,
  noteTimelineDuration,
  onCompactNoteTimelineStart,
  onDuplicateSelectedNote,
  onNoteTimelineDurationChange,
  onRedo,
  onResetNoteTimelineDuration,
  onRevertSelectedNote,
  onSelectedNoteDurationChange,
  onSelectedNoteStartTimeChange,
  onToggleTimelineSnap,
  onTimelineSnapStepChange,
  onUndo,
  redoCount,
  selectedNoteHistoryStatus,
  selectedRecordedNote,
  shortcutHint,
  timelineSnapEnabled,
  timelineSnapStep,
  undoCount,
}: LabNoteEditorProps) {
  const isDurationLocked = selectedRecordedNote ? isSmcPadRecordedNote(selectedRecordedNote) : false

  return (
    <section className="note-editor" aria-label="Editar nota seleccionada">
      <h2>Editar nota seleccionada</h2>

      <div className="timeline-tools" aria-label="Herramientas de timeline">
        <label className="timeline-snap-toggle">
          <input
            checked={timelineSnapEnabled}
            type="checkbox"
            onChange={(event) => onToggleTimelineSnap(event.target.checked)}
          />
          Snap
        </label>
        <label className="timeline-step-label" htmlFor="timeline-snap-step">
          Paso (s)
        </label>
        <select
          disabled={!timelineSnapEnabled}
          id="timeline-snap-step"
          value={timelineSnapStep}
          onChange={(event) => onTimelineSnapStepChange(Number(event.target.value))}
        >
          <option value={0.05}>0.05s</option>
          <option value={0.1}>0.10s</option>
          <option value={0.25}>0.25s</option>
          <option value={0.5}>0.50s</option>
        </select>
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
        <button disabled={!canUndo} onClick={onUndo} type="button">
          Deshacer
        </button>
        <button disabled={!canRedo} onClick={onRedo} type="button">
          Rehacer
        </button>
        <span className="history-shortcuts" title={`Atajos: ${shortcutHint}`}>
          Atajos: {shortcutHint}
        </span>
        <span className="history-indicator">
          Historial: {undoCount}/{historyLimit} | Rehacer: {redoCount}
        </span>
        <span className={`drag-status ${isTimelineDragging ? "drag-status-active" : ""}`}>
          {isTimelineDragging ? "Arrastre activo" : "Arrastre inactivo"}
        </span>
        {selectedNoteHistoryStatus ? (
          <span
            className={`history-note-status history-note-status-${selectedNoteHistoryStatus}`}
          >
            Nota {selectedNoteHistoryStatus === "modificada" ? "modificada" : "sin cambios"}
          </span>
        ) : null}
      </div>

      <div className="project-control-grid">
        <div className="control-group">
          <label htmlFor="note-timeline-duration">Duracion timeline notas (s)</label>
          <input
            id="note-timeline-duration"
            min="1"
            step="0.1"
            type="number"
            value={noteTimelineDuration.toFixed(2)}
            onChange={(event) =>
              onNoteTimelineDurationChange(Number(event.target.value))
            }
          />
        </div>
        <div className="control-group">
          <span className="project-label">Rango visible</span>
          <div className="actions">
            <button onClick={onResetNoteTimelineDuration} type="button">
              Ajustar notas al contenido
            </button>
            <button onClick={onCompactNoteTimelineStart} type="button">
              Compactar inicio
            </button>
          </div>
        </div>
      </div>

      {selectedRecordedNote ? (
        <div className="note-editor-grid">
          <div>
            <span className="project-label">Nota</span>
            <strong>{selectedRecordedNote.note}</strong>
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
        </div>
      ) : (
        <p className="project-message">
          Selecciona una nota en la lista o la timeline para editarla.
        </p>
      )}
    </section>
  )
}
