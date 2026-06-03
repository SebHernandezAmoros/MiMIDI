import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import {
  getMidiClipDuration,
  getMidiTracks,
  getSamplerTracks,
  getAudioClipTracks,
  getSamplerTrackDuration,
  type AudioClip,
  type MidiClip,
  type MidiTrack,
  type SamplerClip,
  type SamplerTrack,
  type AudioClipTrack,
  type TimelineTrack,
} from "../../engine/project/projectModel"
import { isSmcPadRecordedNote } from "../../engine/midi/events"
import { resolveAppMessages, type AppLanguage } from "../../app/appI18n"
import "./TrackTimelinePreview.css"

type SelectedClipInfo = { trackId: string; clipId: string; type: "midi" | "sampler" }

type TrackTimelinePreviewProps = {
  activeTrackId: string
  language?: AppLanguage
  onDragStateChange?: (isDragging: boolean) => void
  onRenameMix?: (mixId: string, name: string) => void
  onSelectClip?: (info: SelectedClipInfo | null) => void
  onSelectLane?: (laneId: string) => void
  onSelectTrack: (trackId: string) => void
  selectedClipId?: { trackId: string; clipId: string } | null
  selectedLaneId?: string | null
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
  onUpdateAudioClipStartTime?: (
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

function preventOverlap(
  newStart: number,
  initialStart: number,
  clipDuration: number,
  others: { start: number; duration: number }[],
): number {
  const start = Math.max(0, newStart)
  if (newStart >= initialStart) {
    let cap = Infinity
    for (const o of others) {
      if (o.start >= initialStart + clipDuration - 0.001) {
        cap = Math.min(cap, o.start - clipDuration)
      }
    }
    return cap === Infinity ? start : Math.max(0, Math.min(start, cap))
  } else {
    let floor = 0
    for (const o of others) {
      if (o.start + o.duration <= initialStart + 0.001) {
        floor = Math.max(floor, o.start + o.duration)
      }
    }
    return Math.max(start, floor)
  }
}

function getRulerTicks(total: number): number[] {
  const steps = [0.5, 1, 2, 5, 10, 15, 20, 30, 60]
  const step = steps.find((s) => Math.floor(total / s) <= 12) ?? 60
  const ticks: number[] = []
  let t = 0
  while (t <= total + 0.001) {
    ticks.push(Math.round(t * 100) / 100)
    t += step
  }
  return ticks
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TrackTimelinePreview({
  activeTrackId,
  language,
  onDragStateChange,
  onRenameMix,
  onSelectClip,
  onSelectLane,
  onSelectTrack,
  onUpdateMidiClipStartTime,
  onUpdateSamplerClipStartTime,
  onUpdateAudioClipStartTime,
  playheadTime,
  selectedClipId,
  selectedLaneId,
  timeline,
  timelineLength,
}: TrackTimelinePreviewProps) {
  const tl = resolveAppMessages(language ?? "es").lab.timeline
  const midiTracks = getMidiTracks(timeline).filter((t) =>
    t.trackType !== "steps" && t.clips.some((c) => c.notes.length > 0),
  )
  const samplerTracks = getSamplerTracks(timeline).filter((t) =>
    t.pattern.lanes.some((l) => l.steps.some((s) => s.active)),
  )
  const audioClipTracks = getAudioClipTracks(timeline)
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
    const otherClips = track.clips
      .filter((c) => c.id !== clip.id)
      .map((c) => ({ start: c.startTime, duration: getMidiClipDuration(c) }))
    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      latestStart = preventOverlap(initialStart + delta, initialStart, clipDuration, otherClips)
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
    onSelectLane?.(mix.id)

    const trackEl = event.currentTarget.closest(".track-timeline-track")
    if (!(trackEl instanceof HTMLElement)) return
    onDragStateChange?.(true)

    const trackWidth = Math.max(trackEl.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = clip.startTime
    const startX = event.clientX
    const clipDuration = getSamplerTrackDuration(mix)
    const otherClips = mix.clips
      .filter((c) => c.id !== clip.id)
      .map((c) => ({ start: c.startTime, duration: clipDuration }))
    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      latestStart = preventOverlap(initialStart + delta, initialStart, clipDuration, otherClips)
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

  // ── Audio clip drag ─────────────────────────────────────────────────────

  function startAudioClipDrag(
    event: ReactPointerEvent<HTMLElement>,
    track: AudioClipTrack,
    clip: AudioClip,
  ) {
    if (!onUpdateAudioClipStartTime) return
    event.preventDefault()
    event.stopPropagation()
    onSelectLane?.(track.id)

    const trackEl = event.currentTarget.closest(".track-timeline-track")
    if (!(trackEl instanceof HTMLElement)) return
    onDragStateChange?.(true)

    const trackWidth = Math.max(trackEl.getBoundingClientRect().width, 1)
    const secondsPerPixel = timelineLength / trackWidth
    const initialStart = clip.startTime
    const startX = event.clientX
    const clipDuration = track.duration
    const otherClips = track.clips
      .filter((c) => c.id !== clip.id)
      .map((c) => ({ start: c.startTime, duration: clipDuration }))
    let latestStart = initialStart
    let hasMoved = false

    const handlePointerMove = (e: PointerEvent) => {
      const delta = (e.clientX - startX) * secondsPerPixel
      hasMoved = hasMoved || Math.abs(delta) > 0.0001
      latestStart = preventOverlap(initialStart + delta, initialStart, clipDuration, otherClips)
      onUpdateAudioClipStartTime(track.id, clip.id, latestStart, "transient")
    }

    const stopDragging = () => {
      if (hasMoved) onUpdateAudioClipStartTime(track.id, clip.id, latestStart, "commit")
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
    <section className="track-timeline-preview" aria-label={tl.title} data-tutorial="track-timeline">
      <div className="track-timeline-header">
        <div>
          <h2>{tl.title}</h2>
          <p className="project-message">
            {tl.subtitle}
          </p>
        </div>
        <div className="timeline-ruler">
          <span>0s</span>
          <span>{timelineLength.toFixed(1)}s</span>
        </div>
      </div>

      {midiTracks.length === 0 && samplerTracks.length === 0 && audioClipTracks.length === 0 ? (
        <p className="timeline-empty">{tl.empty}</p>
      ) : (
        <div className="track-timeline-lanes">
          {/* Time ruler */}
          <div className="track-timeline-time-ruler" aria-hidden="true">
            <div className="track-timeline-time-ruler-meta" />
            <div className="track-timeline-time-ruler-track">
              {getRulerTicks(timelineLength).map((t) => (
                <span
                  className="track-timeline-time-ruler-tick"
                  key={t}
                  style={{
                    left: `${(t / timelineLength) * 100}%`,
                    transform: t === 0 ? "translateX(0)" : t >= timelineLength ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {t === 0 ? "0" : t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : `${t}s`}
                </span>
              ))}
            </div>
          </div>

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
            const isActive = track.id === activeTrackId && !selectedLaneId
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
                    {track.clips.reduce((s, c) => s + c.notes.length, 0)} {tl.notesSuffix} · {filledClips.length} {filledClips.length !== 1 ? tl.clipsSuffix : tl.clipSuffix}
                  </span>
                  {(track.muted || isActive) && (
                    <div className="track-timeline-badges">
                      {track.muted ? <span className="track-timeline-badge track-timeline-badge-muted">{tl.mute}</span> : null}
                      {isActive ? <span className="track-timeline-badge">{tl.active}</span> : null}
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

          {audioClipTracks.map((track: AudioClipTrack) => {
            const isLaneActive = selectedLaneId === track.id
            return (
              <div
                className={[
                  "track-timeline-lane track-timeline-lane-mix",
                  isLaneActive ? "track-timeline-lane-mix-active" : "",
                  track.muted ? "track-timeline-lane-muted" : "",
                ].filter(Boolean).join(" ")}
                key={track.id}
                onClick={() => onSelectLane?.(track.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectLane?.(track.id) }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="track-timeline-meta">
                  <strong>{track.name}</strong>
                  <span className="project-label">{track.duration.toFixed(1)}s · audio · {track.clips.length} {track.clips.length !== 1 ? tl.clipsSuffix : tl.clipSuffix}</span>
                  {track.muted && (
                    <span className="track-timeline-badge track-timeline-badge-muted">Mute</span>
                  )}
                </div>
                <div className="track-timeline-track">
                  {track.clips.map((clip: AudioClip) => {
                    const isPlaying = playheadTime != null
                      && playheadTime >= clip.startTime
                      && playheadTime <= clip.startTime + track.duration
                    return (
                      <div
                        className={[
                          "track-timeline-clip track-timeline-clip-mix",
                          isPlaying ? "track-timeline-clip-playing" : "",
                        ].filter(Boolean).join(" ")}
                        key={clip.id}
                        onPointerDown={(e) => startAudioClipDrag(e, track, clip)}
                        style={
                          {
                            "--track-clip-duration": track.duration / timelineLength,
                            "--track-clip-start": clip.startTime / timelineLength,
                          } as TrackTimelineStyle
                        }
                      >
                        <span className="track-timeline-mix-label">{track.name}</span>
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
                  selectedLaneId === mix.id ? "track-timeline-lane-mix-active" : "",
                  mix.muted ? "track-timeline-lane-muted" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={mix.id}
                onClick={() => onSelectLane?.(mix.id)}
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
                      title={tl.renameDouble}
                    >
                      {mix.name}
                    </strong>
                  )}
                  <span className="project-label">
                    {mix.pattern.bpm < 10 ? mix.pattern.bpm.toFixed(2) : Math.round(mix.pattern.bpm)} BPM · {mix.pattern.stepsPerBar} {tl.stepsSuffix} · {mix.clips.length} {mix.clips.length !== 1 ? tl.clipsSuffix : tl.clipSuffix}
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
