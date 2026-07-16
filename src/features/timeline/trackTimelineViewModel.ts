import type {
  NormalizedTrackTimelineClip,
} from "../../domain/project/trackDataHandlers"
import {
  getTrackDataHandler,
  getTrackTimelineClips,
} from "../../domain/project/trackDataHandlers"
import type { TimelineTrack } from "../../domain/project/projectTypes"
import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
} from "../../domain/project/projectTypes"
import {
  getAudioClipTracks,
  getMidiTracks,
  getSamplerTracks,
} from "../../domain/project/timelineQueries"
import type { TrackLaneDefinition } from "./trackLaneDefinitions"
import { getTrackLaneDefinition } from "./trackLaneDefinitions"

export type TrackTimelineLaneViewModel = {
  capabilities: TrackTimelineLaneCapabilities
  clips: NormalizedTrackTimelineClip[]
  clipsById: Map<string, NormalizedTrackTimelineClip>
  definition: TrackLaneDefinition
  id: string
  kind: TimelineTrack["kind"]
  muted: boolean
  name: string
  summaryLabel: string
}

export type TrackTimelineLaneCapabilities = {
  canDeleteClip: boolean
  canDuplicateClip: boolean
  canMute: boolean
  canSolo: boolean
  canTrim: boolean
}

export type TrackTimelineLaneSummaryLabels = {
  clipSuffix: string
  clipsSuffix: string
  notesSuffix: string
  stepsSuffix: string
}

export type TrackTimelineLaneEntry<TTrack extends TimelineTrack> = {
  track: TTrack
  viewModel: TrackTimelineLaneViewModel
}

export type TrackTimelineLaneGroups = {
  audioClip: Array<TrackTimelineLaneEntry<AudioClipTrack>>
  midi: Array<TrackTimelineLaneEntry<MidiTrack>>
  sampler: Array<TrackTimelineLaneEntry<SamplerTrack>>
}

export function createTrackTimelineLaneViewModel(
  track: TimelineTrack,
  labels: TrackTimelineLaneSummaryLabels = {
    clipSuffix: "clip",
    clipsSuffix: "clips",
    notesSuffix: "notes",
    stepsSuffix: "steps",
  },
): TrackTimelineLaneViewModel {
  const capabilities = getTrackTimelineLaneCapabilities(track)
  const clips = getTrackTimelineClips(track).filter((clip) => {
    if (track.kind !== "midi") return true

    return track.clips.some(
      (candidate) => candidate.id === clip.id && candidate.notes.length > 0,
    )
  })

  return {
    capabilities,
    clips,
    clipsById: new Map(clips.map((clip) => [clip.id, clip])),
    definition: getTrackLaneDefinition(track),
    id: track.id,
    kind: track.kind,
    muted: track.muted,
    name: track.name,
    summaryLabel: createLaneSummaryLabel(track, clips.length, labels),
  }
}

export function createTrackTimelineLaneGroups(
  timeline: TimelineTrack[],
  labels?: TrackTimelineLaneSummaryLabels,
): TrackTimelineLaneGroups {
  return {
    audioClip: getAudioClipTracks(timeline).map((track) => ({
      track,
      viewModel: createTrackTimelineLaneViewModel(track, labels),
    })),
    midi: getMidiTracks(timeline)
      .map((track) => ({
        track,
        viewModel: createTrackTimelineLaneViewModel(track, labels),
      }))
      .filter(
        (lane) =>
          lane.track.trackType !== "steps" && lane.viewModel.clips.length > 0,
      ),
    sampler: getSamplerTracks(timeline)
      .filter((track) =>
        track.pattern.lanes.some((lane) =>
          lane.steps.some((step) => step.active),
        ),
      )
      .map((track) => ({
        track,
        viewModel: createTrackTimelineLaneViewModel(track, labels),
      })),
  }
}

function getTrackTimelineLaneCapabilities(
  track: TimelineTrack,
): TrackTimelineLaneCapabilities {
  switch (track.kind) {
    case "midi":
      return getTrackHandlerCapabilities(getTrackDataHandler(track))
    case "sampler":
      return getTrackHandlerCapabilities(getTrackDataHandler(track))
    case "audio-clip":
      return getTrackHandlerCapabilities(getTrackDataHandler(track))
  }
}

function getTrackHandlerCapabilities(
  handler: TrackTimelineLaneCapabilities,
): TrackTimelineLaneCapabilities {
  return {
    canDeleteClip: handler.canDeleteClip,
    canDuplicateClip: handler.canDuplicateClip,
    canMute: handler.canMute,
    canSolo: handler.canSolo,
    canTrim: handler.canTrim,
  }
}

function createLaneSummaryLabel(
  track: TimelineTrack,
  visibleClipCount: number,
  labels: TrackTimelineLaneSummaryLabels,
): string {
  if (track.kind === "midi") {
    const noteCount = track.clips.reduce(
      (sum, clip) => sum + clip.notes.length,
      0,
    )

    return `${noteCount} ${labels.notesSuffix} · ${visibleClipCount} ${getClipCountSuffix(visibleClipCount, labels)}`
  }

  if (track.kind === "audio-clip") {
    return `${track.duration.toFixed(1)}s · audio · ${track.clips.length} ${getClipCountSuffix(track.clips.length, labels)}`
  }

  const bpmLabel = track.pattern.bpm < 10
    ? track.pattern.bpm.toFixed(2)
    : String(Math.round(track.pattern.bpm))

  return `${bpmLabel} BPM · ${track.pattern.stepsPerBar} ${labels.stepsSuffix} · ${track.clips.length} ${getClipCountSuffix(track.clips.length, labels)}`
}

function getClipCountSuffix(
  clipCount: number,
  labels: TrackTimelineLaneSummaryLabels,
): string {
  return clipCount !== 1 ? labels.clipsSuffix : labels.clipSuffix
}
