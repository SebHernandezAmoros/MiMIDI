import type { TimelineTrack } from "../../domain/project/projectTypes"
import { getSamplerTracks } from "../../domain/project/timelineQueries"

export const DEFAULT_PLUGIN_WORKSPACE_BPM = 120

export function getPluginWorkspaceBpm(timeline: TimelineTrack[]): number {
  return getSamplerTracks(timeline)[0]?.pattern.bpm
    ?? DEFAULT_PLUGIN_WORKSPACE_BPM
}
