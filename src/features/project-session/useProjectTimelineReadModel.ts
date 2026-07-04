import type {
  MidiTrack,
  MusicalProject,
} from "../../domain/project/projectTypes"
import {
  getActiveClip,
  getMidiTrackNotes,
  getProjectTrackTimelineLength,
  getTrackVolumeAutomationValue,
  getTrackNoteTimelineLength,
  isTrackAudible,
} from "../../domain/project/timelineDurationQueries"

export type UseProjectTimelineReadModelOptions = {
  midiTracks: MidiTrack[]
  primaryTrack: MidiTrack
  project: MusicalProject
}

export function useProjectTimelineReadModel(
  options: UseProjectTimelineReadModelOptions,
) {
  const { midiTracks, primaryTrack, project } = options
  const primaryTrackNotes = getMidiTrackNotes(primaryTrack)
  const allRecordedNotes = midiTracks
    .filter((track) => track.trackType !== "steps")
    .flatMap((track) => getMidiTrackNotes(track))

  return {
    activeClip: getActiveClip(primaryTrack),
    allRecordedNotes,
    getTrackAutomationVolumeAtTime: (time: number) =>
      getTrackVolumeAutomationValue(primaryTrack.volumeAutomation, time),
    isPrimaryTrackAudible: isTrackAudible(primaryTrack, midiTracks),
    noteCount: primaryTrackNotes.length,
    primaryTrackNoteTimelineLength: getTrackNoteTimelineLength(primaryTrack),
    primaryTrackNotes,
    projectTrackTimelineLength: getProjectTrackTimelineLength(project),
  }
}
