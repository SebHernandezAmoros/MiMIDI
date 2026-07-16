import { getTrackDataHandler } from "../../domain/project/trackDataHandlers"
import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
  TimelineTrack,
} from "../../domain/project/projectTypes"
import {
  getAudioClipTracks,
  getMidiTracks,
  getSamplerTracks,
} from "../../domain/project/timelineQueries"

export type TrackLaneToolbarCapabilities = {
  canDeleteClip: boolean
  canDuplicateClip: boolean
  canMute: boolean
  canSolo: boolean
  canTrim: boolean
}

export type ActiveTrackLaneContextOptions = {
  primaryTrack: MidiTrack
  selectedLaneId: string | null | undefined
  timeline: TimelineTrack[]
}

export type ActiveTrackLaneContext = {
  activeAudioTrack: AudioClipTrack | null
  activeSamplerTrack: SamplerTrack | null
  activeTimelineTrack: TimelineTrack
}

export type TrackLaneDuplicateClipAvailabilityOptions = {
  capabilities: Pick<TrackLaneToolbarCapabilities, "canDuplicateClip">
  hasDuplicateTargetClip: boolean
}

export type TrackLaneDuplicateClipCommandOptions = {
  midiClipId: string | null
  samplerClipId: string | null
  track: TimelineTrack
}

export type TrackLaneDuplicateClipCommand =
  | {
      action: "duplicate-midi-clip"
      clipId: string
      trackId: string
    }
  | {
      action: "duplicate-sampler-clip"
      clipId: string
      trackId: string
    }

export type TrackLaneDeleteClipAction = {
  isEnabled: boolean
  isVisible: boolean
}

export type TrackLaneDeleteClipActionOptions = {
  capabilities: Pick<TrackLaneToolbarCapabilities, "canDeleteClip">
  hasDeletableSelectedClip: boolean
}

export type TrackLaneMuteSoloState = {
  isMuted: boolean
  isSolo: boolean
}

export type SelectedTrackLaneClip = {
  clipId: string
  trackId: string
  type: "midi" | "sampler"
}

export type SelectedTrackLaneClipDeletionOptions = {
  selectedClip: SelectedTrackLaneClip | null
  timeline: TimelineTrack[]
}

export type SelectedTrackLaneClipDeleteCommand =
  | {
      action: "remove-midi-clip"
      clipId: string
      trackId: string
    }
  | {
      action: "remove-sampler-clip"
      clipId: string
      trackId: string
    }

export function resolveTrackLaneToolbarCapabilities(
  track: TimelineTrack,
): TrackLaneToolbarCapabilities {
  switch (track.kind) {
    case "midi":
      return toTrackLaneToolbarCapabilities(getTrackDataHandler(track))
    case "sampler":
      return toTrackLaneToolbarCapabilities(getTrackDataHandler(track))
    case "audio-clip":
      return toTrackLaneToolbarCapabilities(getTrackDataHandler(track))
  }
}

export function resolveActiveTrackLaneContext({
  primaryTrack,
  selectedLaneId,
  timeline,
}: ActiveTrackLaneContextOptions): ActiveTrackLaneContext {
  const activeSamplerTrack = selectedLaneId
    ? getSamplerTracks(timeline).find((track) => track.id === selectedLaneId) ?? null
    : null
  const activeAudioTrack = !activeSamplerTrack && selectedLaneId
    ? getAudioClipTracks(timeline).find((track) => track.id === selectedLaneId) ?? null
    : null

  return {
    activeAudioTrack,
    activeSamplerTrack,
    activeTimelineTrack: activeSamplerTrack ?? activeAudioTrack ?? primaryTrack,
  }
}

export function resolveTrackLaneDuplicateClipAvailability({
  capabilities,
  hasDuplicateTargetClip,
}: TrackLaneDuplicateClipAvailabilityOptions): boolean {
  return capabilities.canDuplicateClip && hasDuplicateTargetClip
}

export function resolveTrackLaneDuplicateClipCommand({
  midiClipId,
  samplerClipId,
  track,
}: TrackLaneDuplicateClipCommandOptions): TrackLaneDuplicateClipCommand | null {
  switch (track.kind) {
    case "midi":
      return midiClipId
        ? { action: "duplicate-midi-clip", clipId: midiClipId, trackId: track.id }
        : null
    case "sampler":
      return samplerClipId
        ? {
            action: "duplicate-sampler-clip",
            clipId: samplerClipId,
            trackId: track.id,
          }
        : null
    case "audio-clip":
      return null
  }
}

export function resolveTrackLaneDeleteClipAction({
  capabilities,
  hasDeletableSelectedClip,
}: TrackLaneDeleteClipActionOptions): TrackLaneDeleteClipAction {
  const isVisible = capabilities.canDeleteClip

  return {
    isEnabled: isVisible && hasDeletableSelectedClip,
    isVisible,
  }
}

export function resolveTrackLaneMuteSoloState(
  track: TimelineTrack,
): TrackLaneMuteSoloState {
  switch (track.kind) {
    case "midi":
      return { isMuted: track.muted, isSolo: track.solo }
    case "sampler":
      return { isMuted: track.muted, isSolo: track.solo ?? false }
    case "audio-clip":
      return { isMuted: track.muted, isSolo: false }
  }
}

export function resolveSelectedTrackLaneClipDeletion({
  selectedClip,
  timeline,
}: SelectedTrackLaneClipDeletionOptions): boolean {
  if (!selectedClip) return false

  if (selectedClip.type === "midi") {
    const track = getMidiTracks(timeline).find(
      (candidate) => candidate.id === selectedClip.trackId,
    )

    return (track?.clips.length ?? 0) > 1
  }

  const track = getSamplerTracks(timeline).find(
    (candidate) => candidate.id === selectedClip.trackId,
  )

  return (track?.clips.length ?? 0) > 1
}

export function resolveSelectedTrackLaneClipDeleteCommand(
  selectedClip: SelectedTrackLaneClip | null,
): SelectedTrackLaneClipDeleteCommand | null {
  if (!selectedClip) return null

  return {
    action:
      selectedClip.type === "midi"
        ? "remove-midi-clip"
        : "remove-sampler-clip",
    clipId: selectedClip.clipId,
    trackId: selectedClip.trackId,
  }
}

function toTrackLaneToolbarCapabilities(
  handler: TrackLaneToolbarCapabilities,
): TrackLaneToolbarCapabilities {
  return {
    canDeleteClip: handler.canDeleteClip,
    canDuplicateClip: handler.canDuplicateClip,
    canMute: handler.canMute,
    canSolo: handler.canSolo,
    canTrim: handler.canTrim,
  }
}
