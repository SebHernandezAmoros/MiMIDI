import { strToU8, zipSync } from "fflate"
import type { SampleRepository } from "../ports/SampleRepository"
import type { SampleSlotRepository } from "../ports/SampleSlotRepository"
import {
  getAudioClipTracks,
  type MusicalProject,
} from "../../engine/project/projectModel"
import { createLegacyProjectBundleExportUseCaseDependencies } from "./legacyProjectBundleExportUseCaseDependencies"

export type ExportProjectBundleDependencies = {
  samples: Pick<SampleRepository, "load">
  sampleSlots: Pick<SampleSlotRepository, "loadSlots">
}

export async function exportProjectBundleWithDependencies(
  dependencies: ExportProjectBundleDependencies,
  project: MusicalProject,
): Promise<Blob> {
  const slots = dependencies.sampleSlots.loadSlots().filter(Boolean)

  const files: Record<string, Uint8Array> = {
    "project.json": strToU8(JSON.stringify(project, null, 2)),
    "slots.json": strToU8(JSON.stringify(slots)),
  }

  for (const slot of slots) {
    if (!slot) continue
    const buffer = await dependencies.samples.load(slot.dbId)
    if (buffer) files[`samples/${slot.dbId}`] = new Uint8Array(buffer)
  }

  for (const track of getAudioClipTracks(project.timeline)) {
    if (`samples/${track.dbId}` in files) continue
    const buffer = await dependencies.samples.load(track.dbId)
    if (buffer) files[`samples/${track.dbId}`] = new Uint8Array(buffer)
  }

  // Level 0 stores audio without compression; audio is already compressed or PCM.
  const zipped = zipSync(files, { level: 0 })
  return new Blob([zipped], { type: "application/zip" })
}

export async function exportProjectBundle(
  project: MusicalProject,
): Promise<Blob> {
  return exportProjectBundleWithDependencies(
    createLegacyProjectBundleExportUseCaseDependencies(),
    project,
  )
}
