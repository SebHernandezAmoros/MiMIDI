export type TrackSelectionOption = {
  id: string
}

export type ResolveTrackIdByOffsetOptions = {
  currentTrackId: string
  offset: -1 | 1
  tracks: readonly TrackSelectionOption[]
}

export type ResolveActiveTrackIdAfterTrackListChangeOptions = {
  currentTrackId: string
  tracks: readonly TrackSelectionOption[]
}

export function resolveTrackIdByOffset(
  options: ResolveTrackIdByOffsetOptions,
): string | null {
  const { currentTrackId, offset, tracks } = options
  const currentIndex = tracks.findIndex((track) => track.id === currentTrackId)
  if (currentIndex < 0) return tracks[0]?.id ?? null
  return tracks[currentIndex + offset]?.id ?? null
}

export function resolveActiveTrackIdAfterTrackListChange(
  options: ResolveActiveTrackIdAfterTrackListChangeOptions,
): string | null {
  const { currentTrackId, tracks } = options
  if (tracks.some((track) => track.id === currentTrackId)) return null
  return tracks[0]?.id ?? null
}
