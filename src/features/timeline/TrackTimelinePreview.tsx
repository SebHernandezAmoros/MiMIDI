import { useState, type PointerEvent as ReactPointerEvent } from "react"
import {
  getMidiClipDuration,
  getSamplerTrackDuration,
  type AudioClip,
  type MidiClip,
  type MidiTrack,
  type SamplerClip,
  type SamplerTrack,
  type AudioClipTrack,
  type TimelineTrack,
} from "../../engine/project/projectModel"
import { resolveAppMessages, type AppLanguage } from "../../app/appI18n"
import { AudioClipTimelineLane } from "./AudioClipTimelineLane"
import { createTrackTimelineLaneGroups } from "./trackTimelineViewModel"
import { resolveTrackTimelineDraggedClipStart } from "./trackTimelineDrag"
import { MidiTimelineLane } from "./MidiTimelineLane"
import { SamplerTimelineLane } from "./SamplerTimelineLane"
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

// ─── Drag helpers ────────────────────────────────────────────────────────────

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
  const laneSummaryLabels = {
    clipSuffix: tl.clipSuffix,
    clipsSuffix: tl.clipsSuffix,
    notesSuffix: tl.notesSuffix,
    stepsSuffix: tl.stepsSuffix,
  }
  const laneGroups = createTrackTimelineLaneGroups(timeline, laneSummaryLabels)
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
      latestStart = resolveTrackTimelineDraggedClipStart({
        clipDuration,
        initialStart,
        otherClips,
        pointerDeltaPixels: e.clientX - startX,
        secondsPerPixel,
      })
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
      latestStart = resolveTrackTimelineDraggedClipStart({
        clipDuration,
        initialStart,
        otherClips,
        pointerDeltaPixels: e.clientX - startX,
        secondsPerPixel,
      })
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
      latestStart = resolveTrackTimelineDraggedClipStart({
        clipDuration,
        initialStart,
        otherClips,
        pointerDeltaPixels: e.clientX - startX,
        secondsPerPixel,
      })
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

      {laneGroups.midi.length === 0 && laneGroups.sampler.length === 0 && laneGroups.audioClip.length === 0 ? (
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
          {laneGroups.midi.map(({ track, viewModel: laneViewModel }) => (
            <MidiTimelineLane
              activeLabel={tl.active}
              activeTrackId={activeTrackId}
              key={laneViewModel.id}
              laneViewModel={laneViewModel}
              muteLabel={tl.mute}
              onClipPointerDown={startMidiClipDrag}
              onSelectTrack={onSelectTrack}
              playheadTime={playheadTime}
              selectedClipId={selectedClipId}
              selectedLaneId={selectedLaneId}
              timelineLength={timelineLength}
              track={track}
            />
          ))}

          {laneGroups.audioClip.map(({ track, viewModel: laneViewModel }) => (
            <AudioClipTimelineLane
              key={laneViewModel.id}
              laneViewModel={laneViewModel}
              onClipPointerDown={startAudioClipDrag}
              onSelectLane={onSelectLane}
              playheadTime={playheadTime}
              selectedLaneId={selectedLaneId}
              timelineLength={timelineLength}
              track={track}
            />
          ))}

          {laneGroups.sampler.map(({ track: mix, viewModel: laneViewModel }) => (
            <SamplerTimelineLane
              editingMixName={editingMixName}
              isEditing={editingMixId === laneViewModel.id}
              key={laneViewModel.id}
              laneViewModel={laneViewModel}
              onCancelEditing={() => setEditingMixId(null)}
              onClipPointerDown={startSamplerClipDrag}
              onCommitEditing={(mixId, name) => {
                onRenameMix?.(mixId, name)
                setEditingMixId(null)
              }}
              onEditingMixNameChange={setEditingMixName}
              onSelectLane={onSelectLane}
              onStartEditing={(mixId, name) => {
                setEditingMixId(mixId)
                setEditingMixName(name)
              }}
              playheadTime={playheadTime}
              renameDoubleLabel={tl.renameDouble}
              selectedClipId={selectedClipId}
              selectedLaneId={selectedLaneId}
              timelineLength={timelineLength}
              track={mix}
            />
          ))}
        </div>
      )}
    </section>
  )
}
