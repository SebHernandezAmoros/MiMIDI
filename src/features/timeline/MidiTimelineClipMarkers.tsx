import type { CSSProperties } from "react"

import type { MidiClip } from "../../domain/project/projectTypes"
import { isSmcPadRecordedNote } from "../../engine/midi/events"

type MidiTimelineMarkerStyle = CSSProperties & {
  "--track-marker-duration"?: number
  "--track-marker-start"?: number
}

type MidiTimelineClipMarkersProps = {
  clip: MidiClip
  clipDuration: number
}

export function MidiTimelineClipMarkers({
  clip,
  clipDuration,
}: MidiTimelineClipMarkersProps) {
  return (
    <>
      {clip.notes
        .slice()
        .sort((a, b) => a.startTime - b.startTime)
        .map((note) => (
          <span
            className={[
              "track-timeline-note-marker",
              isSmcPadRecordedNote(note) ? "track-timeline-note-marker-smc" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={note.id}
            style={
              {
                "--track-marker-duration": note.duration / clipDuration,
                "--track-marker-start": note.startTime / clipDuration,
              } as MidiTimelineMarkerStyle
            }
          />
        ))}
    </>
  )
}
