import { strFromU8, unzip } from "fflate"
import type { SampleRepository } from "../ports/SampleRepository"
import type { SampleSlotRepository } from "../ports/SampleSlotRepository"
import type { MusicalProject } from "../../engine/project/projectModel"
import { createLegacyProjectBundleImportUseCaseDependencies } from "./legacyProjectBundleImportUseCaseDependencies"

export type ImportProjectBundleDependencies = {
  samples: Pick<SampleRepository, "save">
  sampleSlots: Pick<SampleSlotRepository, "saveSlots">
  parseProject(json: string): MusicalProject
}

async function unzipFile(file: File): Promise<Record<string, Uint8Array>> {
  const arrayBuffer = await file.arrayBuffer()

  return new Promise((resolve, reject) => {
    unzip(new Uint8Array(arrayBuffer), (error, data) => {
      if (error) reject(error)
      else resolve(data)
    })
  })
}

function toOwnedArrayBuffer(data: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(data.byteLength)
  copy.set(data)
  return copy.buffer
}

export async function importProjectBundleWithDependencies(
  dependencies: ImportProjectBundleDependencies,
  file: File,
): Promise<MusicalProject> {
  const entries = await unzipFile(file)

  if (!entries["project.json"]) {
    throw new Error("Archivo .mimidi invalido: falta project.json")
  }

  const project = dependencies.parseProject(strFromU8(entries["project.json"]))

  if (entries["slots.json"]) {
    const slots = JSON.parse(strFromU8(entries["slots.json"])) as unknown

    if (Array.isArray(slots)) {
      dependencies.sampleSlots.saveSlots(slots)
    }
  }

  for (const [path, data] of Object.entries(entries)) {
    if (!path.startsWith("samples/")) continue

    const dbId = path.slice("samples/".length)
    if (dbId) await dependencies.samples.save(dbId, toOwnedArrayBuffer(data))
  }

  return project
}

export async function importProjectBundle(file: File): Promise<MusicalProject> {
  return importProjectBundleWithDependencies(
    createLegacyProjectBundleImportUseCaseDependencies(),
    file,
  )
}
