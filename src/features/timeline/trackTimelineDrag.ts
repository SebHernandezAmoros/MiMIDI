export type TrackTimelineClipBounds = {
  duration: number
  start: number
}

export type PreventTrackTimelineClipOverlapOptions = {
  clipDuration: number
  initialStart: number
  newStart: number
  otherClips: TrackTimelineClipBounds[]
}

export type ResolveTrackTimelineDraggedClipStartOptions = {
  clipDuration: number
  initialStart: number
  otherClips: TrackTimelineClipBounds[]
  pointerDeltaPixels: number
  secondsPerPixel: number
}

export function preventTrackTimelineClipOverlap({
  clipDuration,
  initialStart,
  newStart,
  otherClips,
}: PreventTrackTimelineClipOverlapOptions): number {
  const start = Math.max(0, newStart)

  if (newStart >= initialStart) {
    let cap = Infinity
    for (const clip of otherClips) {
      if (clip.start >= initialStart + clipDuration - 0.001) {
        cap = Math.min(cap, clip.start - clipDuration)
      }
    }

    return cap === Infinity ? start : Math.max(0, Math.min(start, cap))
  }

  let floor = 0
  for (const clip of otherClips) {
    if (clip.start + clip.duration <= initialStart + 0.001) {
      floor = Math.max(floor, clip.start + clip.duration)
    }
  }

  return Math.max(start, floor)
}

export function resolveTrackTimelineDraggedClipStart({
  clipDuration,
  initialStart,
  otherClips,
  pointerDeltaPixels,
  secondsPerPixel,
}: ResolveTrackTimelineDraggedClipStartOptions): number {
  const delta = pointerDeltaPixels * secondsPerPixel

  return preventTrackTimelineClipOverlap({
    clipDuration,
    initialStart,
    newStart: initialStart + delta,
    otherClips,
  })
}
