import { useCallback, useState } from "react"
import type { MusicalProject } from "../../domain/project/projectTypes"
import { getSamplerTracks } from "../../domain/project/timelineQueries"
import {
  formatAudioExportFailedMessage,
  formatAudioExportedMessage,
  formatOfflineAudioUnsupportedMessage,
} from "./projectSessionMessages"

type SaveFileType = {
  accept: Record<string, string[]>
  description: string
}

type ProjectAudioExport = {
  blob: Blob
  duration: number
  fileName: string
  types: SaveFileType[]
}

type UseProjectAudioTransferOptions = {
  dependencies: {
    createProjectAudioExport: (
      project: MusicalProject,
      masterVolume: number,
    ) => Promise<ProjectAudioExport>
    isOfflineAudioSupported: () => boolean
    saveFile: (
      blob: Blob,
      suggestedName: string,
      types: SaveFileType[],
    ) => Promise<void>
  }
  hasRecordedNotes: boolean
  project: MusicalProject
  setProjectMessage: (message: string) => void
}

export function useProjectAudioTransfer({
  dependencies,
  hasRecordedNotes,
  project,
  setProjectMessage,
}: UseProjectAudioTransferOptions) {
  const [isExportingAudio, setIsExportingAudio] = useState(false)

  const exportProjectAudio = useCallback(
    async (masterVolume: number) => {
      if (!hasRecordedNotes && getSamplerTracks(project.timeline).length === 0) {
        return
      }
      if (isExportingAudio) return

      if (!dependencies.isOfflineAudioSupported()) {
        setProjectMessage(formatOfflineAudioUnsupportedMessage())
        return
      }

      setIsExportingAudio(true)
      try {
        const { blob, duration, fileName, types } =
          await dependencies.createProjectAudioExport(project, masterVolume)
        await dependencies.saveFile(blob, fileName, types)
        setProjectMessage(formatAudioExportedMessage(duration))
      } catch {
        setProjectMessage(formatAudioExportFailedMessage())
      } finally {
        setIsExportingAudio(false)
      }
    },
    [
      dependencies,
      hasRecordedNotes,
      isExportingAudio,
      project,
      setProjectMessage,
    ],
  )

  return {
    isExportingAudio,
    exportProjectAudio,
  }
}
