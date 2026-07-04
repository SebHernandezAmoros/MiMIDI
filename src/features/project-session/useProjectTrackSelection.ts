import {
  resolveTrackIdByOffset,
  type TrackSelectionOption,
} from "./projectSessionTrackSelection"

export type UseProjectTrackSelectionOptions = {
  currentTrackId: string
  setActiveTrackId: (trackId: string) => void
  setSelectedRecordedNoteId: (noteId: string | null) => void
  tracks: readonly TrackSelectionOption[]
}

export function useProjectTrackSelection(
  options: UseProjectTrackSelectionOptions,
) {
  const {
    currentTrackId,
    setActiveTrackId,
    setSelectedRecordedNoteId,
    tracks,
  } = options

  function switchActiveTrack(trackId: string) {
    setActiveTrackId(trackId)
    setSelectedRecordedNoteId(null)
  }

  function switchTrackByOffset(offset: -1 | 1) {
    const nextTrackId = resolveTrackIdByOffset({
      currentTrackId,
      offset,
      tracks,
    })
    if (!nextTrackId) return
    switchActiveTrack(nextTrackId)
  }

  return {
    switchActiveTrack,
    switchTrackByOffset,
  }
}
