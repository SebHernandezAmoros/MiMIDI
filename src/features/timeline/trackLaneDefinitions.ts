import type { TrackTimelineLaneViewModel } from "./trackTimelineViewModel"

export type TrackLaneDefinition = {
  kind: TrackTimelineLaneViewModel["kind"]
  role: "audio" | "notes" | "pattern"
}

export const midiTrackLaneDefinition: TrackLaneDefinition = {
  kind: "midi",
  role: "notes",
}

export const samplerTrackLaneDefinition: TrackLaneDefinition = {
  kind: "sampler",
  role: "pattern",
}

export const audioClipTrackLaneDefinition: TrackLaneDefinition = {
  kind: "audio-clip",
  role: "audio",
}

export const trackLaneDefinitions = [
  midiTrackLaneDefinition,
  samplerTrackLaneDefinition,
  audioClipTrackLaneDefinition,
] as const

export function getTrackLaneDefinition(
  lane: Pick<TrackTimelineLaneViewModel, "kind">,
): TrackLaneDefinition {
  switch (lane.kind) {
    case "midi":
      return midiTrackLaneDefinition
    case "sampler":
      return samplerTrackLaneDefinition
    case "audio-clip":
      return audioClipTrackLaneDefinition
  }
}
