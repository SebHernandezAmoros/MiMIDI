import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import { isSmcPadRecordedNote, type MidiRecordedNote } from "../../engine/midi/events"
import { noteToMidiNumber } from "../../engine/midi/notes"
import type { MusicalNote } from "../../engine/midi/notes"
import "./TimelinePreview.css"

type TimelinePreviewProps = {
  notes: MidiRecordedNote[]
  onSelectNote?: (noteId: string) => void
  onRemoveSelectedNote?: (noteId: string) => void
  onDragStateChange?: (isDragging: boolean) => void
  onUpdateNote?: (
    noteId: string,
    patch: Partial<Pick<MidiRecordedNote, "startTime" | "duration">>,
    historyMode?: "transient" | "commit",
  ) => void
  selectedNoteId?: string | null
  timelineLength?: number
}

type TimelineNoteStyle = CSSProperties & {
  "--note-duration"?: number
  "--note-start"?: number
}

type TimelineLane = {
  note: MusicalNote
  recordedNotes: MidiRecordedNote[]
}

function groupNotesByPitch(notes: MidiRecordedNote[]) {
  const laneMap = new Map<MusicalNote, MidiRecordedNote[]>()

  for (const note of notes) {
    laneMap.set(note.note, [...(laneMap.get(note.note) ?? []), note])
  }

  return Array.from(laneMap.entries())
    .map<TimelineLane>(([note, recordedNotes]) => ({
      note,
      recordedNotes: [...recordedNotes].sort((a, b) => a.startTime - b.startTime),
    }))
    .sort((a, b) => noteToMidiNumber(a.note) - noteToMidiNumber(b.note))
}

export function TimelinePreview({
  notes,
  onSelectNote,
  onRemoveSelectedNote,
  onDragStateChange,
  onUpdateNote,
  selectedNoteId,
  timelineLength: providedTimelineLength,
}: TimelinePreviewProps) {
  const orderedNotes = [...notes].sort((a, b) => a.startTime - b.startTime)
  const lanes = groupNotesByPitch(orderedNotes)
  const timelineLength =
    providedTimelineLength ??
    Math.max(
      orderedNotes.reduce(
        (latestEnd, note) => Math.max(latestEnd, note.startTime + note.duration),
        0,
      ),
      1,
    )

  function startNoteDrag(
    event: ReactPointerEvent<HTMLElement>,
    note: MidiRecordedNote,
    mode: "move" | "resize",
  ) {
    if (!onUpdateNote) {
      return
    }

    if (mode === "resize" && isSmcPadRecordedNote(note)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onSelectNote?.(note.id)

    const trackElement = event.currentTarget.closest(".timeline-track")

    if (!(trackElement instanceof HTMLElement)) {
      return
    }

    onDragStateChange?.(true)

    const trackWidth = Math.max(trackElement.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const startX = event.clientX
    const initialStart = note.startTime
    const initialDuration = note.duration
    let hasMoved = false
    let latestStart = initialStart
    let latestDuration = initialDuration

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaSeconds = (moveEvent.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(deltaSeconds) > 0.0001

      if (mode === "move") {
        latestStart = Math.max(0, initialStart + deltaSeconds)
        onUpdateNote(note.id, { startTime: latestStart }, "transient")
        return
      }

      latestDuration = Math.max(0.01, initialDuration + deltaSeconds)
      onUpdateNote(note.id, { duration: latestDuration }, "transient")
    }

    const stopDragging = () => {
      if (hasMoved) {
        if (mode === "move") {
          onUpdateNote(note.id, { startTime: latestStart }, "commit")
        } else {
          onUpdateNote(note.id, { duration: latestDuration }, "commit")
        }
      }

      onDragStateChange?.(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
  }

  return (
    <section className="timeline-preview" aria-label="Timeline MIDI">
      <h2>Timeline</h2>

      <div className="timeline-ruler">
        <span>0s</span>
        <span>{timelineLength.toFixed(1)}s</span>
      </div>

      {selectedNoteId && onRemoveSelectedNote ? (
        <div className="timeline-actions">
          <button onClick={() => onRemoveSelectedNote(selectedNoteId)} type="button">
            Borrar nota seleccionada
          </button>
        </div>
      ) : null}

      {lanes.length === 0 ? (
        <p className="timeline-empty">Las notas grabadas apareceran aqui.</p>
      ) : (
        <div className="timeline-lanes">
          {lanes.map((lane) => (
            <div className="timeline-lane" key={lane.note}>
              <span className="timeline-note-label">{lane.note}</span>
              <div className="timeline-track">
                {lane.recordedNotes.map((note) => (
                  <div
                    className={[
                      "timeline-note-block",
                      note.id === selectedNoteId ? "timeline-note-block-selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={note.id}
                    onPointerDown={(event) => startNoteDrag(event, note, "move")}
                    onClick={() => onSelectNote?.(note.id)}
                    style={
                      {
                        "--note-duration": note.duration / timelineLength,
                        "--note-start": note.startTime / timelineLength,
                      } as TimelineNoteStyle
                    }
                  >
                    {isSmcPadRecordedNote(note) ? null : (
                      <span
                        className="timeline-note-handle"
                        onPointerDown={(event) => startNoteDrag(event, note, "resize")}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
