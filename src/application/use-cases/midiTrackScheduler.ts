import type {
  MidiTrack,
  ScheduledTrackNote,
} from "../../domain/project/projectTypes"

export const midiTrackScheduler = {
  kind: "midi" as const,
  getScheduledNotes: getMidiTrackScheduledNotes,
}

export function getMidiTrackScheduledNotes(
  track: MidiTrack,
): ScheduledTrackNote[] {
  return track.clips.flatMap((clip) =>
    clip.notes.map((note) => ({
      absoluteStartTime: clip.startTime + note.startTime,
      clip,
      note,
      relativeStartTime: note.startTime,
      track,
    })),
  )
}
