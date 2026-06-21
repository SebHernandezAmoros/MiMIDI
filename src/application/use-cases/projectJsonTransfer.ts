import type { MusicalProject } from "../../domain/project/projectTypes"
import { parseImportedProject } from "../../domain/project/projectParsing"

export type ProjectJsonFile = {
  text(): Promise<string>
}

export type ParseProjectJson = (projectJson: string) => MusicalProject

export const PROJECT_JSON_FILE_TYPES = [
  { description: "Proyecto MiMIDI", accept: { "application/json": [".json"] } },
]

export function createProjectJsonExport(project: MusicalProject): {
  blob: Blob
  fileName: string
  types: typeof PROJECT_JSON_FILE_TYPES
} {
  return {
    blob: new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    }),
    fileName: `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`,
    types: PROJECT_JSON_FILE_TYPES,
  }
}

export async function importProjectJsonFileWithParser(
  file: ProjectJsonFile,
  parseProject: ParseProjectJson,
): Promise<MusicalProject> {
  return parseProject(await file.text())
}

export function importProjectJsonFile(
  file: ProjectJsonFile,
): Promise<MusicalProject> {
  return importProjectJsonFileWithParser(file, parseImportedProject)
}
