import type { MidiTrack, PercussionTrackRole } from "./projectTypes"

export function getPercussionTrackRole(
  track: MidiTrack,
): PercussionTrackRole | null {
  if (track.trackType !== "percussion") return null
  return track.percussionRole === "beats" ? "beats" : "pads"
}

export function isPercussionTrackRole(
  track: MidiTrack,
  role: PercussionTrackRole,
): boolean {
  return getPercussionTrackRole(track) === role
}

export function getPadTracks(tracks: MidiTrack[]): MidiTrack[] {
  return tracks.filter((track) => isPercussionTrackRole(track, "pads"))
}

export function getBeatsTracks(tracks: MidiTrack[]): MidiTrack[] {
  return tracks.filter((track) => isPercussionTrackRole(track, "beats"))
}
