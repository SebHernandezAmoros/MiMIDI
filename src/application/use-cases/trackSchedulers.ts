import type { TimelineTrack } from "../../domain/project/projectTypes"

import { audioClipTrackScheduler } from "./audioClipTrackScheduler"
import { midiTrackScheduler } from "./midiTrackScheduler"
import { samplerTrackScheduler } from "./samplerTrackScheduler"

export const trackSchedulers = [
  midiTrackScheduler,
  samplerTrackScheduler,
  audioClipTrackScheduler,
] as const

export type TrackScheduler = (typeof trackSchedulers)[number]

export function getTrackScheduler(
  track: Pick<TimelineTrack, "kind">,
): TrackScheduler {
  switch (track.kind) {
    case "midi":
      return midiTrackScheduler
    case "sampler":
      return samplerTrackScheduler
    case "audio-clip":
      return audioClipTrackScheduler
  }
}
