import { zip, strToU8 } from "fflate"
import { loadSlotMetas } from "../../engine/audio/sampleModel"
import { loadSampleBuffer } from "../../engine/audio/sampleStorage"
import type { MusicalProject } from "../../engine/project/projectModel"

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

  return new Promise((resolve, reject) => {
    // level 0 = store sin comprimir (el audio ya está comprimido o es PCM)
    zip(files, { level: 0 }, (err, data) => {
      if (err) reject(err)
      else resolve(new Blob([data], { type: "application/zip" }))
    })
  })
}
