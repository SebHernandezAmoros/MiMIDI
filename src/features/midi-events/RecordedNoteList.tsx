import type { MidiRecordedNote } from "../../engine/midi/events"
import "./RecordedNoteList.css"

type RecordedNoteListProps = {
  notes: MidiRecordedNote[]
  onRemoveNote?: (noteId: string) => void
  onSelectNote?: (noteId: string) => void
  selectedNoteId?: string | null
}

export function RecordedNoteList({
  notes,
  onRemoveNote,
  onSelectNote,
  selectedNoteId,
}: RecordedNoteListProps) {
  return (
    <section className="recorded-note-list" aria-label="Notas MIDI grabadas">
      <h2>Notas grabadas</h2>

      {notes.length === 0 ? (
        <p className="recorded-note-empty">Toca y suelta una tecla.</p>
      ) : (
        <ol className="recorded-note-items">
          {notes.map((recordedNote) => (
            <li
              className={[
                "recorded-note-item",
                recordedNote.id === selectedNoteId ? "recorded-note-item-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={recordedNote.id}
              onClick={() => onSelectNote?.(recordedNote.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelectNote?.(recordedNote.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <strong>{recordedNote.note}</strong>
              <span>{recordedNote.startTime.toFixed(2)}s</span>
              <span>{recordedNote.duration.toFixed(2)}s</span>
              {onRemoveNote ? (
                <button
                  className="recorded-note-remove"
                  onClick={() => onRemoveNote(recordedNote.id)}
                  type="button"
                >
                  Borrar
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
