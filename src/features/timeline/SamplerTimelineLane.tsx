import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react"

import type {
  SamplerClip,
  SamplerTrack,
} from "../../domain/project/projectTypes"
import type { TrackTimelineLaneViewModel } from "./trackTimelineViewModel"

type SelectedClipInfo = { trackId: string; clipId: string }

type TrackTimelineStyle = CSSProperties & {
  "--track-clip-duration"?: number
  "--track-clip-start"?: number
}

type SamplerTimelineLaneProps = {
  editingMixName: string
  isEditing: boolean
  laneViewModel: TrackTimelineLaneViewModel
  onCancelEditing: () => void
  onClipPointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    track: SamplerTrack,
    clip: SamplerClip,
  ) => void
  onCommitEditing: (laneId: string, name: string) => void
  onEditingMixNameChange: (name: string) => void
  onSelectLane?: (laneId: string) => void
  onStartEditing: (laneId: string, name: string) => void
  playheadTime?: number | null
  renameDoubleLabel: string
  selectedClipId?: SelectedClipInfo | null
  selectedLaneId?: string | null
  timelineLength: number
  track: SamplerTrack
}

export function SamplerTimelineLane({
  editingMixName,
  isEditing,
  laneViewModel,
  onCancelEditing,
  onClipPointerDown,
  onCommitEditing,
  onEditingMixNameChange,
  onSelectLane,
  onStartEditing,
  playheadTime,
  renameDoubleLabel,
  selectedClipId,
  selectedLaneId,
  timelineLength,
  track,
}: SamplerTimelineLaneProps) {
  const commitEditing = () => {
    if (editingMixName.trim()) {
      onCommitEditing(laneViewModel.id, editingMixName.trim())
      return
    }

    onCancelEditing()
  }

  return (
    <div
      className={[
        "track-timeline-lane track-timeline-lane-mix",
        selectedLaneId === laneViewModel.id ? "track-timeline-lane-mix-active" : "",
        laneViewModel.muted ? "track-timeline-lane-muted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelectLane?.(laneViewModel.id)}
      role="button"
      tabIndex={0}
    >
      <div className="track-timeline-meta">
        {isEditing ? (
          <input
            autoFocus
            className="track-timeline-mix-name-input"
            onBlur={commitEditing}
            onChange={(e) => onEditingMixNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEditing()
              if (e.key === "Escape") onCancelEditing()
            }}
            onClick={(e) => e.stopPropagation()}
            type="text"
            value={editingMixName}
          />
        ) : (
          <strong
            onDoubleClick={(e) => {
              e.stopPropagation()
              onStartEditing(laneViewModel.id, laneViewModel.name)
            }}
            title={renameDoubleLabel}
          >
            {laneViewModel.name}
          </strong>
        )}
        <span className="project-label">
          {laneViewModel.summaryLabel}
        </span>
        {laneViewModel.muted && (
          <span className="track-timeline-badge track-timeline-badge-muted">Mute</span>
        )}
      </div>
      <div className="track-timeline-track">
        {track.clips.map((clip) => {
          const clipDuration = laneViewModel.clipsById.get(clip.id)?.duration ?? laneViewModel.clips[0]?.duration ?? 0
          const isPlaying = playheadTime != null
            && playheadTime >= clip.startTime
            && playheadTime <= clip.startTime + clipDuration

          return (
            <div
              className={[
                "track-timeline-clip track-timeline-clip-mix",
                selectedClipId?.clipId === clip.id && selectedClipId?.trackId === laneViewModel.id
                  ? "track-timeline-clip-selected"
                  : "",
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
