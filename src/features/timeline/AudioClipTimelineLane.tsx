import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react"

import type {
  AudioClip,
  AudioClipTrack,
} from "../../domain/project/projectTypes"
import type { TrackTimelineLaneViewModel } from "./trackTimelineViewModel"

type TrackTimelineStyle = CSSProperties & {
  "--track-clip-duration"?: number
  "--track-clip-start"?: number
}

type AudioClipTimelineLaneProps = {
  laneViewModel: TrackTimelineLaneViewModel
  onClipPointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    track: AudioClipTrack,
    clip: AudioClip,
  ) => void
  onSelectLane?: (laneId: string) => void
  playheadTime?: number | null
  selectedLaneId?: string | null
  timelineLength: number
  track: AudioClipTrack
}

export function AudioClipTimelineLane({
  laneViewModel,
  onClipPointerDown,
  onSelectLane,
  playheadTime,
  selectedLaneId,
  timelineLength,
  track,
}: AudioClipTimelineLaneProps) {
  const isLaneActive = selectedLaneId === laneViewModel.id

  return (
    <div
      className={[
        "track-timeline-lane track-timeline-lane-mix",
        isLaneActive ? "track-timeline-lane-mix-active" : "",
        laneViewModel.muted ? "track-timeline-lane-muted" : "",
      ].filter(Boolean).join(" ")}
      onClick={() => onSelectLane?.(laneViewModel.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectLane?.(laneViewModel.id) }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="track-timeline-meta">
        <strong>{laneViewModel.name}</strong>
        <span className="project-label">{laneViewModel.summaryLabel}</span>
        {laneViewModel.muted && (
          <span className="track-timeline-badge track-timeline-badge-muted">Mute</span>
        )}
      </div>
      <div className="track-timeline-track">
        {track.clips.map((clip) => {
          const clipDuration = laneViewModel.clipsById.get(clip.id)?.duration ?? track.duration
          const isPlaying = playheadTime != null
            && playheadTime >= clip.startTime
            && playheadTime <= clip.startTime + clipDuration

          return (
            <div
              className={[
                "track-timeline-clip track-timeline-clip-mix",
                isPlaying ? "track-timeline-clip-playing" : "",
              ].filter(Boolean).join(" ")}
              key={clip.id}
              onPointerDown={(e) => onClipPointerDown(e, track, clip)}
              style={
                {
                  "--track-clip-duration": clipDuration / timelineLength,
                  "--track-clip-start": clip.startTime / timelineLength,
                } as TrackTimelineStyle
              }
            >
              <span className="track-timeline-mix-label">{laneViewModel.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
