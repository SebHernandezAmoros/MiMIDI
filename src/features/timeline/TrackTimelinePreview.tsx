import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import {
  getMidiTracks,
  getSamplerTracks,
  getTrackTimelineClipDuration,
  type MidiTrack,
  type SamplerTrack,
  type TimelineTrack,
} from "../../engine/project/projectModel"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import "./TrackTimelinePreview.css"

type TrackTimelinePreviewProps = {
  activeTrackId: string
  onDragStateChange?: (isDragging: boolean) => void
  onRenameMix?: (mixId: string, name: string) => void
  onSelectMix?: (mixId: string) => void
  onSelectTrack: (trackId: string) => void
  selectedMixId?: string | null
  onUpdateSamplerMixStartTime?: (
    mixId: string,
    startTime: number,
    historyMode?: "transient" | "commit",
  ) => void
  onUpdateTrackStartTime?: (
    trackId: string,
    startTime: number,
    historyMode?: "transient" | "commit",
  ) => void
  playheadTime?: number | null
  timeline: TimelineTrack[]
  timelineLength: number
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
  onRenameMix,
  onSelectMix,
  onSelectTrack,
  onUpdateSamplerMixStartTime,
  onUpdateTrackStartTime,
  playheadTime,
  selectedMixId,
  timeline,
  timelineLength,
}: TrackTimelinePreviewProps) {
  const midiTracks = getMidiTracks(timeline)
  const samplerTracks = getSamplerTracks(timeline)
  const [editingMixId, setEditingMixId] = useState<string | null>(null)
  const [editingMixName, setEditingMixName] = useState("")

  function startTrackClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    track: MidiTrack,
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
    const initialStart = track.startTime
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

  function startMixClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    mix: SamplerTrack,
  ) {
    if (!onUpdateSamplerMixStartTime) return
    event.preventDefault()
    event.stopPropagation()
    onSelectMix?.(mix.id)
    const trackElement = event.currentTarget.closest(".track-timeline-track")
    if (!(trackElement instanceof HTMLElement)) return
    onDragStateChange?.(true)
    const trackWidth = Math.max(trackElement.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = mix.startTime
    const startX = event.clientX
    let latestStart = initialStart
    let hasMoved = false
    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      latestStart = Math.max(0, initialStart + delta)
      onUpdateSamplerMixStartTime(mix.id, latestStart, "transient")
    }
    const stopDragging = () => {
      if (hasMoved) onUpdateSamplerMixStartTime(mix.id, latestStart, "commit")
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

      {midiTracks.length === 0 && samplerTracks.length === 0 ? (
        <p className="timeline-empty">Aun no existen pistas en el proyecto.</p>
      ) : (
        <div className="track-timeline-lanes">
          {midiTracks.map((track) => {
            const isActive = track.id === activeTrackId && !selectedMixId
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
                    Inicio: {track.startTime.toFixed(2)}s
                  </span>
                  <div className="track-timeline-badges" aria-label={`Estado de ${track.name}`}>
                    {track.muted ? <span className="track-timeline-badge">Mute</span> : null}
                    {track.solo ? <span className="track-timeline-badge">Solo</span> : null}
                    {isActive ? <span className="track-timeline-badge">Activa</span> : null}
                  </div>
                </div>
                <div className="track-timeline-track">
                  {playheadTime != null && (
                    <div
                      aria-hidden="true"
                      className="timeline-playhead"
                      style={{
                        left: `${Math.min(Math.max(playheadTime / timelineLength, 0), 1) * 100}%`,
                      }}
                    />
                  )}
                  <div
                    className="track-timeline-clip"
                    onPointerDown={(event) => startTrackClipDrag(event, track)}
                    style={
                      {
                        "--track-clip-duration": clipDuration / timelineLength,
                        "--track-clip-start": track.startTime / timelineLength,
                      } as TrackTimelineStyle
                    }
                  >
                    {track.notes.length === 0 ? (
                      <span className="track-timeline-clip-empty">Pista vacia</span>
                    ) : (
                      track.notes
                        .slice()
                        .sort((a, b) => a.startTime - b.startTime)
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
                                "--track-marker-duration":
                                  note.duration / clipDuration,
                                "--track-marker-start":
                                  note.startTime / clipDuration,
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

          {samplerTracks.map((mix) => {
            const secondsPerStep = 60 / mix.pattern.bpm / 4
            const mixDuration = mix.pattern.stepsPerBar * secondsPerStep
            return (
              <div
                className={[
                  "track-timeline-lane track-timeline-lane-mix",
                  selectedMixId === mix.id
                    ? "track-timeline-lane-mix-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={mix.id}
                onClick={() => onSelectMix?.(mix.id)}
                role="button"
                tabIndex={0}
              >
                <div className="track-timeline-meta">
                  {editingMixId === mix.id ? (
                    <input
                      autoFocus
                      className="track-timeline-mix-name-input"
                      onBlur={() => {
                        if (editingMixName.trim())
                          onRenameMix?.(mix.id, editingMixName.trim())
                        setEditingMixId(null)
                      }}
                      onChange={(e) => setEditingMixName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editingMixName.trim())
                            onRenameMix?.(mix.id, editingMixName.trim())
                          setEditingMixId(null)
                        }
                        if (e.key === "Escape") setEditingMixId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      type="text"
                      value={editingMixName}
                    />
                  ) : (
                    <strong
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setEditingMixId(mix.id)
                        setEditingMixName(mix.name)
                      }}
                      title="Doble clic para renombrar"
                    >
                      {mix.name}
                    </strong>
                  )}
                  <span className="project-label">
                    {mix.pattern.bpm} BPM · {mix.pattern.stepsPerBar} pasos
                  </span>
                  <span className="project-label">
                    Inicio: {mix.startTime.toFixed(2)}s
                  </span>
                </div>
                <div className="track-timeline-track">
                  {playheadTime != null && (
                    <div
                      aria-hidden="true"
                      className="timeline-playhead"
                      style={{
                        left: `${Math.min(Math.max(playheadTime / timelineLength, 0), 1) * 100}%`,
                      }}
                    />
                  )}
                  <div
                    className="track-timeline-clip track-timeline-clip-mix"
                    onPointerDown={(e) => startMixClipDrag(e, mix)}
                    style={
                      {
                        "--track-clip-duration": mixDuration / timelineLength,
                        "--track-clip-start": mix.startTime / timelineLength,
                      } as TrackTimelineStyle
                    }
                  >
                    <span className="track-timeline-mix-label">{mix.name}</span>
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
