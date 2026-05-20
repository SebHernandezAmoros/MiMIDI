import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import {
  getMidiClipDuration,
  getMidiTracks,
  getSamplerTracks,
  getSamplerTrackDuration,
  type MidiClip,
  type MidiTrack,
  type SamplerClip,
  type SamplerTrack,
  type TimelineTrack,
} from "../../engine/project/projectModel"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import "./TrackTimelinePreview.css"

type SelectedClipInfo = { trackId: string; clipId: string; type: "midi" | "sampler" }

type TrackTimelinePreviewProps = {
  activeTrackId: string
  onDragStateChange?: (isDragging: boolean) => void
  onRenameMix?: (mixId: string, name: string) => void
  onSelectClip?: (info: SelectedClipInfo | null) => void
  onSelectMix?: (mixId: string) => void
  onSelectTrack: (trackId: string) => void
  selectedClipId?: { trackId: string; clipId: string } | null
  selectedMixId?: string | null
  onUpdateMidiClipStartTime?: (
    trackId: string,
    clipId: string,
    startTime: number,
    historyMode?: "transient" | "commit",
  ) => void
  onUpdateSamplerClipStartTime?: (
    trackId: string,
    clipId: string,
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

// ─── Drag helpers ────────────────────────────────────────────────────────────

function getOtherClipIntervals(
  clips: { startTime: number; duration: number }[],
  draggedClipId: string,
  allClips: { id: string; startTime: number; duration: number }[],
): { start: number; end: number }[] {
  void clips
  return allClips
    .filter((c) => c.id !== draggedClipId)
    .map((c) => ({ start: c.startTime, end: c.startTime + c.duration }))
}

function clampNoOverlap(
  newStart: number,
  duration: number,
  others: { start: number; end: number }[],
): number {
  let s = Math.max(0, newStart)
  const end = s + duration

  for (const o of others) {
    // Overlap: push right if we'd start inside another clip
    if (s < o.end && end > o.start) {
      // Snap to nearest side
      const gapLeft = Math.abs(s - (o.start - duration))
      const gapRight = Math.abs(s - o.end)
      s = gapLeft < gapRight ? Math.max(0, o.start - duration) : o.end
    }
  }

  return s
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrackTimelinePreview({
  activeTrackId,
  onDragStateChange,
  onRenameMix,
  onSelectClip,
  onSelectMix,
  onSelectTrack,
  onUpdateMidiClipStartTime,
  onUpdateSamplerClipStartTime,
  playheadTime,
  selectedClipId,
  selectedMixId,
  timeline,
  timelineLength,
}: TrackTimelinePreviewProps) {
  const midiTracks = getMidiTracks(timeline).filter((t) =>
    t.clips.some((c) => c.notes.length > 0),
  )
  const samplerTracks = getSamplerTracks(timeline).filter((t) =>
    t.pattern.lanes.some((l) => l.steps.some((s) => s.active)),
  )
  const [editingMixId, setEditingMixId] = useState<string | null>(null)
  const [editingMixName, setEditingMixName] = useState("")

  // ── MIDI clip drag ──────────────────────────────────────────────────────

  function startMidiClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    track: MidiTrack,
    clip: MidiClip,
  ) {
    if (!onUpdateMidiClipStartTime) return
    event.preventDefault()
    event.stopPropagation()
    onSelectTrack(track.id)

    const trackEl = event.currentTarget.closest(".track-timeline-track")
    if (!(trackEl instanceof HTMLElement)) return
    onDragStateChange?.(true)

    const trackWidth = Math.max(trackEl.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = clip.startTime
    const startX = event.clientX
    const clipDuration = getMidiClipDuration(clip)
    const others = track.clips
      .filter((c) => c.id !== clip.id)
      .map((c) => ({ id: c.id, startTime: c.startTime, duration: getMidiClipDuration(c) }))

    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      const raw = initialStart + delta
      latestStart = clampNoOverlap(raw, clipDuration, others.map((o) => ({ start: o.startTime, end: o.startTime + o.duration })))
      onUpdateMidiClipStartTime(track.id, clip.id, latestStart, "transient")
    }

    const stopDragging = () => {
      if (hasMoved) onUpdateMidiClipStartTime(track.id, clip.id, latestStart, "commit")
      else onSelectClip?.({ trackId: track.id, clipId: clip.id, type: "midi" })
      onDragStateChange?.(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
  }

  // ── Sampler clip drag ───────────────────────────────────────────────────

  function startSamplerClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    mix: SamplerTrack,
    clip: SamplerClip,
  ) {
    if (!onUpdateSamplerClipStartTime) return
    event.preventDefault()
    event.stopPropagation()
    onSelectMix?.(mix.id)

    const trackEl = event.currentTarget.closest(".track-timeline-track")
    if (!(trackEl instanceof HTMLElement)) return
    onDragStateChange?.(true)

    const trackWidth = Math.max(trackEl.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = clip.startTime
    const startX = event.clientX
    const clipDuration = getSamplerTrackDuration(mix)
    const others = mix.clips
      .filter((c) => c.id !== clip.id)
      .map((c) => ({ start: c.startTime, end: c.startTime + clipDuration }))

    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      const raw = initialStart + delta
      latestStart = clampNoOverlap(raw, clipDuration, others)
      onUpdateSamplerClipStartTime(mix.id, clip.id, latestStart, "transient")
    }

    const stopDragging = () => {
      if (hasMoved) onUpdateSamplerClipStartTime(mix.id, clip.id, latestStart, "commit")
      else onSelectClip?.({ trackId: mix.id, clipId: clip.id, type: "sampler" })
      onDragStateChange?.(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="track-timeline-preview" aria-label="Timeline por pistas">
      <div className="track-timeline-header">
        <div>
          <h2>Timeline por pistas</h2>
          <p className="project-message">
            Arrastra los clips para ordenarlos. Usa el botón copiar para duplicar.
          </p>
        </div>
        <div className="timeline-ruler">
          <span>0s</span>
          <span>{timelineLength.toFixed(1)}s</span>
        </div>
      </div>

      {midiTracks.length === 0 && samplerTracks.length === 0 ? (
        <p className="timeline-empty">Graba notas o activa pasos en el secuenciador para ver las pistas aquí.</p>
      ) : (
        <div className="track-timeline-lanes">
          {playheadTime != null && (
            <div aria-hidden="true" className="track-timeline-playhead-overlay">
              <div className="track-timeline-playhead-overlay-meta" />
              <div className="track-timeline-playhead-overlay-track">
                <div
                  className="track-timeline-global-playhead"
                  style={{ left: `${Math.min(Math.max(playheadTime / timelineLength, 0), 1) * 100}%` }}
                />
              </div>
            </div>
          )}
          {midiTracks.map((track) => {
            const isActive = track.id === activeTrackId && !selectedMixId
            const filledClips = track.clips.filter((c) => c.notes.length > 0)

            return (
              <div
                className={[
                  "track-timeline-lane",
                  isActive ? "track-timeline-lane-active" : "",
                  track.muted ? "track-timeline-lane-muted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectTrack(track.id) }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="track-timeline-meta">
                  <strong>{track.name}</strong>
                  <span className="project-label">
                    {track.clips.reduce((s, c) => s + c.notes.length, 0)} notas · {filledClips.length} clip{filledClips.length !== 1 ? "s" : ""}
                  </span>
                  {(track.muted || isActive) && (
                    <div className="track-timeline-badges">
                      {track.muted ? <span className="track-timeline-badge track-timeline-badge-muted">Mute</span> : null}
                      {isActive ? <span className="track-timeline-badge">Activa</span> : null}
                    </div>
                  )}
                </div>
                <div className="track-timeline-track">
                  {filledClips.map((clip) => {
                    const clipDuration = getMidiClipDuration(clip)
                    const isPlaying = playheadTime != null
                      && playheadTime >= clip.startTime
                      && playheadTime <= clip.startTime + clipDuration
                    return (
                      <div
                        className={[
                          "track-timeline-clip",
                          selectedClipId?.clipId === clip.id && selectedClipId?.trackId === track.id
                            ? "track-timeline-clip-selected"
                            : "",
                          isPlaying ? "track-timeline-clip-playing" : "",
                        ].filter(Boolean).join(" ")}
                        key={clip.id}
                        onPointerDown={(e) => startMidiClipDrag(e, track, clip)}
                        style={
                          {
                            "--track-clip-duration": clipDuration / timelineLength,
                            "--track-clip-start": clip.startTime / timelineLength,
                          } as TrackTimelineStyle
                        }
                      >
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
                                } as TrackTimelineStyle
                              }
                            />
                          ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {samplerTracks.map((mix) => {
            const mixDuration = getSamplerTrackDuration(mix)
            return (
              <div
                className={[
                  "track-timeline-lane track-timeline-lane-mix",
                  selectedMixId === mix.id ? "track-timeline-lane-mix-active" : "",
                  mix.muted ? "track-timeline-lane-muted" : "",
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
                        if (editingMixName.trim()) onRenameMix?.(mix.id, editingMixName.trim())
                        setEditingMixId(null)
                      }}
                      onChange={(e) => setEditingMixName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { if (editingMixName.trim()) onRenameMix?.(mix.id, editingMixName.trim()); setEditingMixId(null) }
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
                    {mix.pattern.bpm} BPM · {mix.pattern.stepsPerBar} pasos · {mix.clips.length} clip{mix.clips.length !== 1 ? "s" : ""}
                  </span>
                  {mix.muted && (
                    <span className="track-timeline-badge track-timeline-badge-muted">Mute</span>
                  )}
                </div>
                <div className="track-timeline-track">
                  {mix.clips.map((clip) => {
                    const isPlaying = playheadTime != null
                      && playheadTime >= clip.startTime
                      && playheadTime <= clip.startTime + mixDuration
                    return (
                    <div
                      className={[
                        "track-timeline-clip track-timeline-clip-mix",
                        selectedClipId?.clipId === clip.id && selectedClipId?.trackId === mix.id
                          ? "track-timeline-clip-selected"
                          : "",
                        isPlaying ? "track-timeline-clip-playing" : "",
                      ].filter(Boolean).join(" ")}
                      key={clip.id}
                      onPointerDown={(e) => startSamplerClipDrag(e, mix, clip)}
                      style={
                        {
                          "--track-clip-duration": mixDuration / timelineLength,
                          "--track-clip-start": clip.startTime / timelineLength,
                        } as TrackTimelineStyle
                      }
                    >
                      <span className="track-timeline-mix-label">{mix.name}</span>
                    </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
