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
  laneE2e?: string
  percussionSummaryLabel?: string
  sourceTrackId?: string
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
    laneE2e: createLaneE2e(track),
    muted: track.muted,
    name: track.name,
    percussionSummaryLabel: createPercussionSummaryLabel(track),
    summaryLabel: createLaneSummaryLabel(track, clips.length, labels),
  }
}

function createLaneE2e(track: TimelineTrack): string | undefined {
  if (track.kind !== "midi" || track.trackType !== "percussion") return undefined
  if (track.percussionRole === "beats") return "edit-track-beats-lane"
  return "edit-track-pads-lane"
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
      .flatMap((track) => createMidiTimelineLaneEntries(track, labels))
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

function createMidiTimelineLaneEntries(
  track: MidiTrack,
  labels?: TrackTimelineLaneSummaryLabels,
): Array<TrackTimelineLaneEntry<MidiTrack>> {
  if (track.trackType !== "percussion" || track.percussionRole) {
    return [{
      track,
      viewModel: createTrackTimelineLaneViewModel(track, labels),
    }]
  }

  const programmedTrack = createPercussionDisplayTrack(track, "beats")
  const recordedTrack = createPercussionDisplayTrack(track, "pads")

  return [programmedTrack, recordedTrack]
    .filter((displayTrack) =>
      displayTrack.clips.some((clip) => clip.notes.length > 0),
    )
    .map((displayTrack) => {
      const role = displayTrack.name.endsWith("Beats") ? "beats" : "pads"
      const viewModel = createTrackTimelineLaneViewModel(displayTrack, labels)
      return {
        track: displayTrack,
        viewModel: {
          ...viewModel,
          id: `${track.id}:${role}`,
          laneE2e: role === "beats"
            ? "edit-track-percussion-beats-lane"
            : "edit-track-percussion-pads-lane",
          sourceTrackId: track.id,
        },
      }
    })
}

function createPercussionDisplayTrack(
  track: MidiTrack,
  role: "beats" | "pads",
): MidiTrack {
  const isPadsLane = role === "pads"
  return {
    ...track,
    name: `${track.name} - ${isPadsLane ? "Pads" : "Beats"}`,
    clips: track.clips.map((clip) => ({
      ...clip,
      notes: clip.notes.filter((note) =>
        isPadsLane
          ? note.playbackSource === "smc-pad"
          : note.playbackSource !== "smc-pad",
      ),
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

function createPercussionSummaryLabel(track: TimelineTrack): string | undefined {
  if (track.kind !== "midi" || track.trackType !== "percussion") return undefined

  const notes = track.clips.flatMap((clip) => clip.notes)
  if (notes.length === 0) return undefined

  const recordedCount = notes.filter(
    (note) => note.playbackSource === "smc-pad",
  ).length
  const programmedCount = notes.length - recordedCount

  return `${track.name} · programado ${programmedCount} · grabado ${recordedCount}`
}

function getClipCountSuffix(
  clipCount: number,
  labels: TrackTimelineLaneSummaryLabels,
): string {
  return clipCount !== 1 ? labels.clipsSuffix : labels.clipSuffix
}
