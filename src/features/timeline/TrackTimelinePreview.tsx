import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import {
  getTrackTimelineClipDuration,
  type ProjectTrack,
} from "../../engine/project/projectModel"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import "./TrackTimelinePreview.css"

type TrackTimelinePreviewProps = {
  activeTrackId: string
  onDragStateChange?: (isDragging: boolean) => void
  onSelectTrack: (trackId: string) => void
  onUpdateTrackStartTime?: (
    trackId: string,
    startTime: number,
    historyMode?: "transient" | "commit",
  ) => void
  timelineLength: number
  tracks: ProjectTrack[]
}

type TrackTimelineStyle = CSSProperties & {
  "--track-clip-duration"?: number
  "--track-clip-start"?: number
  "--track-marker-duration"?: number
  "--track-marker-start"?: number
}

export function TrackTimelinePreview({
  activeTrackId,
  onDragStateChange,
  onSelectTrack,
  onUpdateTrackStartTime,
  timelineLength,
  tracks,
}: TrackTimelinePreviewProps) {
  const orderedTracks = [...tracks]

  function startTrackClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    track: ProjectTrack,
  ) {
    if (!onUpdateTrackStartTime) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onSelectTrack(track.id)

    const trackElement = event.currentTarget.closest(".track-timeline-track")

    if (!(trackElement instanceof HTMLElement)) {
      return
    }

    onDragStateChange?.(true)

    const trackWidth = Math.max(trackElement.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = track.timelineClip.startTime
    const startX = event.clientX
    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaSeconds = (moveEvent.clientX - startX) * secondsPerPixel

      hasMoved = hasMoved || Math.abs(deltaSeconds) > 0.0001
      latestStart = Math.max(0, initialStart + deltaSeconds)
      onUpdateTrackStartTime(track.id, latestStart, "transient")
    }

    const stopDragging = () => {
      if (hasMoved) {
        onUpdateTrackStartTime(track.id, latestStart, "commit")
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
    <section className="track-timeline-preview" aria-label="Timeline por pistas">
      <div className="track-timeline-header">
        <div>
          <h2>Timeline por pistas</h2>
          <p className="project-message">
            Arrastra el clip de cada pista para decidir cuando entra en el arreglo.
          </p>
        </div>
        <div className="timeline-ruler">
          <span>0s</span>
          <span>{timelineLength.toFixed(1)}s</span>
        </div>
      </div>

      {orderedTracks.length === 0 ? (
        <p className="timeline-empty">Aun no existen pistas en el proyecto.</p>
      ) : (
        <div className="track-timeline-lanes">
          {orderedTracks.map((track) => {
            const isActive = track.id === activeTrackId
            const clipDuration = getTrackTimelineClipDuration(track)

            return (
              <div
                className={[
                  "track-timeline-lane",
                  isActive ? "track-timeline-lane-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelectTrack(track.id)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="track-timeline-meta">
                  <strong>{track.name}</strong>
                  <span className="project-label">{track.notes.length} notas</span>
                  <span className="project-label">
                    Inicio: {track.timelineClip.startTime.toFixed(2)}s
                  </span>
                  <div className="track-timeline-badges" aria-label={`Estado de ${track.name}`}>
                    {track.muted ? <span className="track-timeline-badge">Mute</span> : null}
                    {track.solo ? <span className="track-timeline-badge">Solo</span> : null}
                    {isActive ? <span className="track-timeline-badge">Activa</span> : null}
                  </div>
                </div>
                <div className="track-timeline-track">
                  <div
                    className="track-timeline-clip"
                    onPointerDown={(event) => startTrackClipDrag(event, track)}
                    style={
                      {
                        "--track-clip-duration": clipDuration / timelineLength,
                        "--track-clip-start": track.timelineClip.startTime / timelineLength,
                      } as TrackTimelineStyle
                    }
                  >
                    {track.notes.length === 0 ? (
                      <span className="track-timeline-clip-empty">Pista vacia</span>
                    ) : (
                      track.notes
                        .slice()
                        .sort((firstNote, secondNote) => firstNote.startTime - secondNote.startTime)
                        .map((note) => (
                          <span
                            className={[
                              "track-timeline-note-marker",
                              isSmcPadRecordedNote(note)
                                ? "track-timeline-note-marker-smc"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            key={note.id}
                            style={
                              {
                                "--track-marker-duration": note.duration / clipDuration,
                                "--track-marker-start": note.startTime / clipDuration,
                              } as TrackTimelineStyle
                            }
                          />
                        ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
