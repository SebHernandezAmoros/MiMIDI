import { useCallback, type ChangeEvent } from "react"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { resolveFirstProjectActiveTrackId } from "../../application/use-cases/projectSelection"
import {
  formatJsonExportedMessage,
  formatJsonImportFailedMessage,
  formatProjectImportedMessage,
} from "./projectSessionMessages"

type SaveFileType = {
  accept: Record<string, string[]>
  description: string
}

type ProjectJsonExport = {
  blob: Blob
  fileName: string
  types: SaveFileType[]
}

type UseProjectJsonTransferOptions = {
  dependencies: {
    createProjectJsonExport: (project: MusicalProject) => ProjectJsonExport
    importProjectJsonFile: (file: File) => Promise<MusicalProject>
    saveFile: (
      blob: Blob,
      suggestedName: string,
      types: SaveFileType[],
    ) => Promise<void>
  }
  project: MusicalProject
  replaceState: (project: MusicalProject) => void
  setActiveTrackId: (trackId: string) => void
  setProjectMessage: (message: string) => void
  setSelectedRecordedNoteId: (noteId: string | null) => void
}

export function useProjectJsonTransfer({
  dependencies,
  project,
  replaceState,
  setActiveTrackId,
  setProjectMessage,
  setSelectedRecordedNoteId,
}: UseProjectJsonTransferOptions) {
  const exportProject = useCallback(async () => {
    const { blob, fileName, types } =
      dependencies.createProjectJsonExport(project)
    await dependencies.saveFile(blob, fileName, types)
    setProjectMessage(formatJsonExportedMessage())
  }, [dependencies, project, setProjectMessage])

  const importProjectFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      try {
        const importedProject =
          await dependencies.importProjectJsonFile(file)
        replaceState(importedProject)
        setActiveTrackId(resolveFirstProjectActiveTrackId(importedProject))
        setSelectedRecordedNoteId(null)
        setProjectMessage(formatProjectImportedMessage(importedProject.name))
      } catch {
        setProjectMessage(formatJsonImportFailedMessage())
      } finally {
        event.target.value = ""
      }
    },
    [
      dependencies,
      replaceState,
      setActiveTrackId,
      setProjectMessage,
      setSelectedRecordedNoteId,
    ],
  )

  return {
    exportProject,
    importProjectFile,
  }
}
