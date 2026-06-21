import type { MusicalProject } from "../../domain/project/projectTypes"
import { exportProjectBundle } from "./exportProjectBundle"
import { importProjectBundle } from "./importProjectBundle"

export type ExportProjectBundleFile = (
  project: MusicalProject,
) => Promise<Blob>

export const PROJECT_BUNDLE_FILE_TYPES = [
  {
    description: "Bundle MiMIDI",
    accept: { "application/octet-stream": [".mimidi"] },
  },
]

export async function createProjectBundleExportWithDependencies(
  project: MusicalProject,
  exportBundle: ExportProjectBundleFile,
): Promise<{
  blob: Blob
  fileName: string
  types: typeof PROJECT_BUNDLE_FILE_TYPES
}> {
  return {
    blob: await exportBundle(project),
    fileName: `${project.name.replace(/\s+/g, "-").toLowerCase()}.mimidi`,
    types: PROJECT_BUNDLE_FILE_TYPES,
  }
}

export function createProjectBundleExport(project: MusicalProject) {
  return createProjectBundleExportWithDependencies(project, exportProjectBundle)
}

export function importProjectBundleFile(file: File): Promise<MusicalProject> {
  return importProjectBundle(file)
}
