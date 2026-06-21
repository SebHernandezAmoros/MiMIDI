import { createProjectTrack } from "./projectFactories"
import { isMidiTrack } from "./timelineQueries"
import type { MusicalProject } from "./projectTypes"

export type ProjectInstrumentAvailability = {
  fallbackInstrumentId: string
  instrumentIds: ReadonlySet<string>
}

export function createDefaultProjectWithPluginStates(
  pluginStates: MusicalProject["pluginStates"],
): MusicalProject {
  return {
    id: "project-1",
    name: "MiMIDI Project",
    padSoundSettings: {},
    padSettingsLocked: false,
    pluginStates,
    timeline: [
      createProjectTrack(1, "melodic"),
      { ...createProjectTrack(2, "percussion"), name: "Pad 1" },
      { ...createProjectTrack(3, "steps"), name: "Steps 1" },
    ],
    trackTimelineDuration: 8,
  }
}

export function resetProjectWithPluginStates(
  project: MusicalProject,
  pluginStates: MusicalProject["pluginStates"],
): MusicalProject {
  return { ...createDefaultProjectWithPluginStates(pluginStates), id: project.id }
}

export function syncProjectTrackInstruments(
  project: MusicalProject,
  availability: ProjectInstrumentAvailability,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isMidiTrack(track) && !availability.instrumentIds.has(track.instrumentId)
        ? { ...track, instrumentId: availability.fallbackInstrumentId }
        : track,
    ),
  }
}
