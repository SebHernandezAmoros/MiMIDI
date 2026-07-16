import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react"

import type { MidiClip } from "../../domain/project/projectTypes"
import { MidiTimelineClipMarkers } from "./MidiTimelineClipMarkers"

type MidiTimelineClipStyle = CSSProperties & {
  "--track-clip-duration"?: number
  "--track-clip-start"?: number
}

type MidiTimelineClipProps = {
  clip: MidiClip
  clipDuration: number
  isPlaying: boolean
  isSelected: boolean
  onPointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    clip: MidiClip,
  ) => void
  timelineLength: number
}

export function MidiTimelineClip({
  clip,
  clipDuration,
  isPlaying,
  isSelected,
  onPointerDown,
  timelineLength,
}: MidiTimelineClipProps) {
  return (
    <div
      className={[
        "track-timeline-clip",
        isSelected ? "track-timeline-clip-selected" : "",
        isPlaying ? "track-timeline-clip-playing" : "",
      ].filter(Boolean).join(" ")}
      onPointerDown={(e) => onPointerDown(e, clip)}
      style={
        {
          "--track-clip-duration": clipDuration / timelineLength,
          "--track-clip-start": clip.startTime / timelineLength,
        } as MidiTimelineClipStyle
      }
    >
      <MidiTimelineClipMarkers
        clip={clip}
        clipDuration={clipDuration}
      />
    </div>
  )
}
