import { zipSync, strToU8 } from "fflate"
import { loadSlotMetas } from "../../engine/audio/sampleModel"
import { loadSampleBuffer } from "../../engine/audio/sampleStorage"
import { getAudioClipTracks, type MusicalProject } from "../../engine/project/projectModel"

export async function exportProjectBundle(project: MusicalProject): Promise<Blob> {
  const slots = loadSlotMetas().filter(Boolean)

  const files: Record<string, Uint8Array> = {
    "project.json": strToU8(JSON.stringify(project, null, 2)),
    "slots.json": strToU8(JSON.stringify(slots)),
  }

  for (const slot of slots) {
    if (!slot) continue
    const buf = await loadSampleBuffer(slot.dbId)
    if (buf) files[`samples/${slot.dbId}`] = new Uint8Array(buf)
  }

  for (const track of getAudioClipTracks(project.timeline)) {
    if (`samples/${track.dbId}` in files) continue
    const buf = await loadSampleBuffer(track.dbId)
    if (buf) files[`samples/${track.dbId}`] = new Uint8Array(buf)
  }

  // level 0 = store sin comprimir (el audio ya está comprimido o es PCM)
  const zipped = zipSync(files, { level: 0 })
  return new Blob([zipped], { type: "application/zip" })
}
