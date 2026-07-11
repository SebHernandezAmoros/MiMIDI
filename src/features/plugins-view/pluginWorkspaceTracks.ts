import type { TimelineTrack } from "../../domain/project/projectTypes"
import { getMidiTracks } from "../../domain/project/timelineQueries"

export type PluginWorkspaceTrack = {
  id: string
  name: string
  type: "melodic" | "percussion"
}

export function getPluginWorkspaceTracks(
  timeline: TimelineTrack[],
): PluginWorkspaceTrack[] {
  return getMidiTracks(timeline)
    .filter((track) => track.trackType !== "steps")
    .map((track) => ({
      id: track.id,
      name: track.name,
      type: track.trackType === "melodic" ? "melodic" : "percussion",
    }))
}
