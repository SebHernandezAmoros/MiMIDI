import type { ProjectRepository } from "../ports/ProjectRepository"
import type { SequencerPattern } from "../../engine/audio/sequencerModel"
import {
  addSamplerMix,
  getSamplerTracks,
  type MusicalProject,
} from "../../engine/project/projectModel"
import { createLegacySendSamplerMixToTimelineUseCaseDependencies } from "./legacySendSamplerMixToTimelineUseCaseDependencies"

export function sendSamplerMixToTimelineWithRepository(
  projects: ProjectRepository,
  pattern: SequencerPattern,
  name: string,
): MusicalProject | null {
  const project = projects.load()

  if (!project) {
    return null
  }

  const mixCount = getSamplerTracks(project.timeline).length
  const mixName = name.trim() || `Mix ${mixCount + 1}`
  const updatedProject = addSamplerMix(project, pattern, mixName)

  projects.save(updatedProject)

  return updatedProject
}

export function sendSamplerMixToTimeline(
  pattern: SequencerPattern,
  name: string,
): MusicalProject | null {
  return sendSamplerMixToTimelineWithRepository(
    createLegacySendSamplerMixToTimelineUseCaseDependencies().projects,
    pattern,
    name,
  )
}
