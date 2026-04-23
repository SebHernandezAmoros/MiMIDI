import type { CSSProperties } from "react"
import type { MidiRecordedNote } from "../../engine/midi/events"
import { noteToMidiNumber } from "../../engine/midi/notes"
import type { MusicalNote } from "../../engine/midi/notes"
import "./TimelinePreview.css"

type TimelinePreviewProps = {
  notes: MidiRecordedNote[]
}

type TimelineNoteStyle = CSSProperties & {
  "--note-duration"?: number
  "--note-start"?: number
}

type TimelineLane = {
  note: MusicalNote
  recordedNotes: MidiRecordedNote[]
}

function getTimelineLength(notes: MidiRecordedNote[]) {
  const lastNoteEnd = notes.reduce(
    (latestEnd, note) => Math.max(latestEnd, note.startTime + note.duration),
    0,
  )

  return Math.max(lastNoteEnd, 1)
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

export function TimelinePreview({ notes }: TimelinePreviewProps) {
  const orderedNotes = [...notes].sort((a, b) => a.startTime - b.startTime)
  const lanes = groupNotesByPitch(orderedNotes)
  const timelineLength = getTimelineLength(orderedNotes)

  return (
    <section className="timeline-preview" aria-label="Timeline MIDI">
      <h2>Timeline</h2>

      <div className="timeline-ruler">
        <span>0s</span>
        <span>{timelineLength.toFixed(1)}s</span>
      </div>

      {lanes.length === 0 ? (
        <p className="timeline-empty">Las notas grabadas apareceran aqui.</p>
      ) : (
        <div className="timeline-lanes">
          {lanes.map((lane) => (
            <div className="timeline-lane" key={lane.note}>
              <span className="timeline-note-label">{lane.note}</span>
              <div className="timeline-track">
                {lane.recordedNotes.map((note) => (
                  <span
                    className="timeline-note-block"
                    key={note.id}
                    style={
                      {
                        "--note-duration": note.duration / timelineLength,
                        "--note-start": note.startTime / timelineLength,
                      } as TimelineNoteStyle
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
