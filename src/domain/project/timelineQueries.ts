import type {
  AudioClipTrack,
  MidiTrack,
  SamplerTrack,
  TimelineTrack,
} from "./projectTypes"

export function isMidiTrack(track: TimelineTrack): track is MidiTrack {
  return track.kind === "midi"
}

export function isSamplerTrack(track: TimelineTrack): track is SamplerTrack {
  return track.kind === "sampler"
}

export function isAudioClipTrack(track: TimelineTrack): track is AudioClipTrack {
  return track.kind === "audio-clip"
}

export function getMidiTracks(timeline: TimelineTrack[]): MidiTrack[] {
  return timeline.filter(isMidiTrack)
}

export function getSamplerTracks(timeline: TimelineTrack[]): SamplerTrack[] {
  return timeline.filter(isSamplerTrack)
}

export function getAudioClipTracks(timeline: TimelineTrack[]): AudioClipTrack[] {
  return timeline.filter(isAudioClipTrack)
}
