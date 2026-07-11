import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
  TimelineTrack,
} from "./projectTypes"
import {
  getMidiClipDuration,
  getSamplerTrackDuration,
} from "./timelineDurationQueries"

export type TrackTimelineClip = {
  id: string
  startTime: number
}

export type NormalizedTrackTimelineClip = TrackTimelineClip & {
  duration: number
}

export type TrackDataHandler<TTrack extends TimelineTrack> = {
  kind: TTrack["kind"]
  getClips(track: TTrack): TrackTimelineClip[]
  getClipDuration(track: TTrack, clipId: string): number
  canMute: boolean
  canSolo: boolean
  canDuplicateClip: boolean
  canTrim: boolean
}

export const midiTrackDataHandler: TrackDataHandler<MidiTrack> = {
  kind: "midi",
  getClips(track) {
    return track.clips.map((clip) => ({
      id: clip.id,
      startTime: clip.startTime,
    }))
  },
  getClipDuration(track, clipId) {
    const clip = track.clips.find((candidate) => candidate.id === clipId)

    return clip ? getMidiClipDuration(clip) : 0
  },
  canMute: true,
  canSolo: true,
  canDuplicateClip: true,
  canTrim: false,
}

export const samplerTrackDataHandler: TrackDataHandler<SamplerTrack> = {
  kind: "sampler",
  getClips(track) {
    return track.clips.map((clip) => ({
      id: clip.id,
      startTime: clip.startTime,
    }))
  },
  getClipDuration(track, clipId) {
    return track.clips.some((clip) => clip.id === clipId)
      ? getSamplerTrackDuration(track)
      : 0
  },
  canMute: true,
  canSolo: true,
  canDuplicateClip: true,
  canTrim: false,
}

export const audioClipTrackDataHandler: TrackDataHandler<AudioClipTrack> = {
  kind: "audio-clip",
  getClips(track) {
    return track.clips.map((clip) => ({
      id: clip.id,
      startTime: clip.startTime,
    }))
  },
  getClipDuration(track, clipId) {
    return track.clips.some((clip) => clip.id === clipId) ? track.duration : 0
  },
  canMute: true,
  canSolo: false,
  canDuplicateClip: false,
  canTrim: false,
}

export const trackDataHandlers = [
  midiTrackDataHandler,
  samplerTrackDataHandler,
  audioClipTrackDataHandler,
] as const

export function getTrackDataHandler(
  track: MidiTrack,
): TrackDataHandler<MidiTrack>
export function getTrackDataHandler(
  track: SamplerTrack,
): TrackDataHandler<SamplerTrack>
export function getTrackDataHandler(
  track: AudioClipTrack,
): TrackDataHandler<AudioClipTrack>
export function getTrackDataHandler(track: TimelineTrack) {
  switch (track.kind) {
    case "midi":
      return midiTrackDataHandler
    case "sampler":
      return samplerTrackDataHandler
    case "audio-clip":
      return audioClipTrackDataHandler
  }
}

export function getTrackTimelineClips(
  track: TimelineTrack,
): NormalizedTrackTimelineClip[] {
  switch (track.kind) {
    case "midi":
      return normalizeTrackTimelineClips(track, getTrackDataHandler(track))
    case "sampler":
      return normalizeTrackTimelineClips(track, getTrackDataHandler(track))
    case "audio-clip":
      return normalizeTrackTimelineClips(track, getTrackDataHandler(track))
  }
}

function normalizeTrackTimelineClips<TTrack extends TimelineTrack>(
  track: TTrack,
  handler: TrackDataHandler<TTrack>,
): NormalizedTrackTimelineClip[] {
  return handler.getClips(track).map((clip) => ({
    ...clip,
    duration: handler.getClipDuration(track, clip.id),
  }))
}
