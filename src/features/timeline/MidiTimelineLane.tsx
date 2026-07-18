import type { PointerEvent as ReactPointerEvent } from "react"

import type {
  MidiClip,
  MidiTrack,
} from "../../domain/project/projectTypes"
import { getMidiClipDuration } from "../../domain/project/timelineDurationQueries"
import { MidiTimelineClip } from "./MidiTimelineClip"
import type { TrackTimelineLaneViewModel } from "./trackTimelineViewModel"

type SelectedClipInfo = { trackId: string; clipId: string }

type MidiTimelineLaneProps = {
  activeLabel: string
  activeTrackId: string
  laneViewModel: TrackTimelineLaneViewModel
  muteLabel: string
  onClipPointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    track: MidiTrack,
    clip: MidiClip,
  ) => void
  onSelectTrack: (trackId: string) => void
  playheadTime?: number | null
  selectedClipId?: SelectedClipInfo | null
  selectedLaneId?: string | null
  timelineLength: number
  track: MidiTrack
}

export function MidiTimelineLane({
  activeLabel,
  activeTrackId,
  laneViewModel,
  muteLabel,
  onClipPointerDown,
  onSelectTrack,
  playheadTime,
  selectedClipId,
  selectedLaneId,
  timelineLength,
  track,
}: MidiTimelineLaneProps) {
  const sourceTrackId = laneViewModel.sourceTrackId ?? laneViewModel.id
  const isActive = sourceTrackId === activeTrackId && !selectedLaneId
  const filledClips = track.clips.filter((clip) =>
    laneViewModel.clipsById.has(clip.id),
  )

  return (
    <div
      className={[
        "track-timeline-lane",
        isActive ? "track-timeline-lane-active" : "",
        laneViewModel.muted ? "track-timeline-lane-muted" : "",
      ].filter(Boolean).join(" ")}
      data-e2e={laneViewModel.laneE2e}
      onClick={() => onSelectTrack(sourceTrackId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectTrack(sourceTrackId) }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="track-timeline-meta">
        <strong>{laneViewModel.name}</strong>
        <span className="project-label">
          {laneViewModel.summaryLabel}
        </span>
        {laneViewModel.percussionSummaryLabel ? (
          <span
            className="project-label track-timeline-percussion-summary"
            data-e2e="edit-track-percussion-summary"
          >
            {laneViewModel.percussionSummaryLabel}
          </span>
        ) : null}
        {(laneViewModel.muted || isActive) && (
          <div className="track-timeline-badges">
            {laneViewModel.muted ? <span className="track-timeline-badge track-timeline-badge-muted">{muteLabel}</span> : null}
            {isActive ? <span className="track-timeline-badge">{activeLabel}</span> : null}
          </div>
        )}
      </div>
      <div className="track-timeline-track">
        {filledClips.map((clip) => {
          const clipDuration = laneViewModel.clipsById.get(clip.id)?.duration ?? getMidiClipDuration(clip)
          const isPlaying = playheadTime != null
            && playheadTime >= clip.startTime
            && playheadTime <= clip.startTime + clipDuration

          return (
            <MidiTimelineClip
              clip={clip}
              clipDuration={clipDuration}
              isPlaying={isPlaying}
              isSelected={
                selectedClipId?.clipId === clip.id && selectedClipId?.trackId === track.id
              }
              key={clip.id}
              onPointerDown={(e, draggedClip) => onClipPointerDown(e, track, draggedClip)}
              timelineLength={timelineLength}
            />
          )
        })}
      </div>
    </div>
  )
}
