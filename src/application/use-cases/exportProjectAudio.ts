import { renderProjectOffline, type OfflineRenderOptions } from "../../engine/audio/offlineAudioRenderer"
import {
  encodeAudioBufferToWav,
  type WavEncodingOptions,
} from "../../engine/audio/wavEncoder"
import type { MusicalProject } from "../../engine/project/projectModel"

export type ExportProjectAudioOptions = OfflineRenderOptions &
  WavEncodingOptions

function sanitizeFileName(name: string) {
  return name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase()
}

export async function exportProjectAudio(
  project: MusicalProject,
  options: ExportProjectAudioOptions = {},
) {
  const audioBuffer = await renderProjectOffline(project, options)
  const wavArrayBuffer = encodeAudioBufferToWav(audioBuffer, options)
  const fileName = `${sanitizeFileName(project.name || "mimidi-project") || "mimidi-project"}.wav`

  return {
    audioBuffer,
    blob: new Blob([wavArrayBuffer], { type: "audio/wav" }),
    duration: audioBuffer.duration,
    fileName,
  }
}
