import type { MusicalProject } from "../../domain/project/projectTypes"
import {
  exportProjectAudio,
  type ExportProjectAudioOptions,
} from "./exportProjectAudio"

export type ExportProjectAudioFile = (
  project: MusicalProject,
  options: ExportProjectAudioOptions,
) => Promise<{
  blob: Blob
  duration: number
  fileName: string
}>

export const PROJECT_AUDIO_FILE_TYPES = [
  { description: "Audio WAV", accept: { "audio/wav": [".wav"] } },
]

export async function createProjectAudioExportWithDependencies(
  project: MusicalProject,
  masterVolume: number,
  exportAudio: ExportProjectAudioFile,
): Promise<{
  blob: Blob
  duration: number
  fileName: string
  types: typeof PROJECT_AUDIO_FILE_TYPES
}> {
  const { blob, duration, fileName } = await exportAudio(project, {
    bitDepth: 32,
    float: true,
    masterVolume,
  })

  return {
    blob,
    duration,
    fileName,
    types: PROJECT_AUDIO_FILE_TYPES,
  }
}

export function createProjectAudioExport(
  project: MusicalProject,
  masterVolume: number,
) {
  return createProjectAudioExportWithDependencies(
    project,
    masterVolume,
    exportProjectAudio,
  )
}
