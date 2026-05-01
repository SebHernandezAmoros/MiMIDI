import type { MidiRecordedNote } from "../../engine/midi/events"

export function getTimelineLength(notes: MidiRecordedNote[]) {
  const lastNoteEnd = notes.reduce(
    (latestEnd, note) => Math.max(latestEnd, note.startTime + note.duration),
    0,
  )

  return Math.max(lastNoteEnd, 1)
}
