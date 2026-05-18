import { unzip, strFromU8 } from "fflate"
import { saveSlotMetas } from "../../engine/audio/sampleModel"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"
import { parseImportedProject, type MusicalProject } from "../../engine/project/projectModel"

export async function importProjectBundle(file: File): Promise<MusicalProject> {
  const arrayBuffer = await file.arrayBuffer()

  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(new Uint8Array(arrayBuffer), (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

  if (!entries["project.json"]) throw new Error("Archivo .mimidi inválido: falta project.json")

  const project = parseImportedProject(strFromU8(entries["project.json"]))

  if (entries["slots.json"]) {
    const slots = JSON.parse(strFromU8(entries["slots.json"])) as unknown
    if (Array.isArray(slots)) saveSlotMetas(slots)
  }

  for (const [path, data] of Object.entries(entries)) {
    if (path.startsWith("samples/")) {
      const dbId = path.slice("samples/".length)
      if (dbId) await saveSampleBuffer(dbId, data.buffer as ArrayBuffer)
    }
  }

  return project
}
