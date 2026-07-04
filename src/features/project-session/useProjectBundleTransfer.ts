import { useCallback, type ChangeEvent } from "react"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { resolveFirstProjectActiveTrackId } from "../../application/use-cases/projectSelection"
import {
  formatBundleExportFailedMessage,
  formatBundleExportedMessage,
  formatBundleImportFailedMessage,
  formatBundlePackagingMessage,
  formatProjectImportedMessage,
  formatProjectImportingMessage,
} from "./projectSessionMessages"

type SaveFileType = {
  accept: Record<string, string[]>
  description: string
}

type ProjectBundleExport = {
  blob: Blob
  fileName: string
  types: SaveFileType[]
}

type UseProjectBundleTransferOptions = {
  dependencies: {
    createProjectBundleExport: (
      project: MusicalProject,
    ) => Promise<ProjectBundleExport>
    importProjectBundleFile: (file: File) => Promise<MusicalProject>
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

export function useProjectBundleTransfer({
  dependencies,
  project,
  replaceState,
  setActiveTrackId,
  setProjectMessage,
  setSelectedRecordedNoteId,
}: UseProjectBundleTransferOptions) {
  const exportBundle = useCallback(async () => {
    try {
      setProjectMessage(formatBundlePackagingMessage())
      const { blob, fileName, types } =
        await dependencies.createProjectBundleExport(project)
      await dependencies.saveFile(blob, fileName, types)
      setProjectMessage(formatBundleExportedMessage())
    } catch {
      setProjectMessage(formatBundleExportFailedMessage())
    }
  }, [dependencies, project, setProjectMessage])

  const importBundle = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      try {
        setProjectMessage(formatProjectImportingMessage())
        const importedProject =
          await dependencies.importProjectBundleFile(file)
        replaceState(importedProject)
        setActiveTrackId(resolveFirstProjectActiveTrackId(importedProject))
        setSelectedRecordedNoteId(null)
        setProjectMessage(formatProjectImportedMessage(importedProject.name))
      } catch {
        setProjectMessage(formatBundleImportFailedMessage())
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
    exportBundle,
    importBundle,
  }
}
