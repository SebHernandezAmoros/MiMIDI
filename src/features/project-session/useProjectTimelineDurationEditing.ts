import type { MusicalProject } from "../../domain/project/projectTypes"
import type { MidiRecordedNote } from "../../engine/midi/events"
import {
  getTrackNoteTimelineContentLength,
  getTracksTimelineLength,
} from "../../domain/project/timelineDurationQueries"
import { getMidiTracks } from "../../domain/project/timelineQueries"
import {
  compactTrackNotesStart,
  updateProjectTrackTimelineDuration,
  updateTrackNoteTimelineDuration,
} from "../../domain/project/projectTrackMutations"

type ProjectUpdater = (project: MusicalProject) => MusicalProject
type ApplyProjectUpdate = (updater: ProjectUpdater) => void

export type UseProjectTimelineDurationEditingOptions = {
  applyUpdate: ApplyProjectUpdate
  primaryTrackId: string
  primaryTrackName: string
  primaryTrackNotes: MidiRecordedNote[]
  setProjectMessage: (message: string) => void
}

export function useProjectTimelineDurationEditing(
  options: UseProjectTimelineDurationEditingOptions,
) {
  const {
    applyUpdate,
    primaryTrackId,
    primaryTrackName,
    primaryTrackNotes,
    setProjectMessage,
  } = options

  function compactPrimaryTrackNoteTimelineStart() {
    if (primaryTrackNotes.length === 0) {
      setProjectMessage(
        `No hay notas en ${primaryTrackName} para compactar.`,
      )
      return
    }
    const earliestStartTime = primaryTrackNotes.reduce(
      (min, note) => Math.min(min, note.startTime),
      Number.POSITIVE_INFINITY,
    )
    if (!Number.isFinite(earliestStartTime) || earliestStartTime <= 0) {
      setProjectMessage(
        `Las notas de ${primaryTrackName} ya empiezan en 0s.`,
      )
      return
    }
    applyUpdate((project) =>
      compactTrackNotesStart(project, primaryTrackId),
    )
    setProjectMessage(
      `Inicio del timeline de notas compactado en ${primaryTrackName}.`,
    )
  }

  function resetProjectTrackTimelineDuration() {
    applyUpdate((project) =>
      updateProjectTrackTimelineDuration(
        project,
        getTracksTimelineLength(project.timeline),
      ),
    )
    setProjectMessage("Duracion del timeline ajustada al contenido.")
  }

  function updateProjectTrackTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((project) =>
      updateProjectTrackTimelineDuration(project, value),
    )
  }

  function updatePrimaryTrackNoteTimelineDurationValue(value: number) {
    if (!Number.isFinite(value)) return
    applyUpdate((project) =>
      updateTrackNoteTimelineDuration(project, primaryTrackId, value),
    )
  }

  function resetPrimaryTrackNoteTimelineDuration() {
    applyUpdate((project) => {
      const currentTrack = getMidiTracks(project.timeline).find(
        (track) => track.id === primaryTrackId,
      )
      if (!currentTrack) return project
      return updateTrackNoteTimelineDuration(
        project,
        primaryTrackId,
        getTrackNoteTimelineContentLength(currentTrack),
      )
    })
    setProjectMessage(
      `Duracion del timeline de notas ajustada al contenido de ${primaryTrackName}.`,
    )
  }

  return {
    compactPrimaryTrackNoteTimelineStart,
    resetPrimaryTrackNoteTimelineDuration,
    resetProjectTrackTimelineDuration,
    updatePrimaryTrackNoteTimelineDurationValue,
    updateProjectTrackTimelineDurationValue,
  }
}
