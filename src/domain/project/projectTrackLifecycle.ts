import type { MidiRecordedNote } from "../../engine/midi/events"
import { createMidiClip, createProjectTrack } from "./projectFactories"
import { getMidiTracks, isMidiTrack } from "./timelineQueries"
import type { MidiTrack, MusicalProject } from "./projectTypes"

function mapMidiTrack(
  project: MusicalProject,
  trackId: string,
  updater: (track: MidiTrack) => MidiTrack,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isMidiTrack(track) && track.id === trackId ? updater(track) : track,
    ),
  }
}

export function appendTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const melodicCount = midiTracks.filter((track) => track.trackType === "melodic").length
  const track = createProjectTrack(midiTracks.length + 1, "melodic")
  return {
    ...project,
    timeline: [
      ...project.timeline,
      { ...track, name: `Track ${melodicCount + 1}` },
    ],
  }
}

export function appendPadTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const padCount = midiTracks.filter((track) => track.trackType === "percussion").length
  const track = createProjectTrack(midiTracks.length + 1, "percussion")
  return {
    ...project,
    timeline: [...project.timeline, { ...track, name: `Pad ${padCount + 1}` }],
  }
}

export function appendStepsTrack(project: MusicalProject): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const stepsCount = midiTracks.filter((track) => track.trackType === "steps").length
  const track = createProjectTrack(midiTracks.length + 1, "steps")
  return {
    ...project,
    timeline: [...project.timeline, { ...track, name: `Steps ${stepsCount + 1}` }],
  }
}

export function appendTrackWithNotes(
  project: MusicalProject,
  name: string,
  instrumentId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  const midiTracks = getMidiTracks(project.timeline)
  const base = createProjectTrack(midiTracks.length + 1, "melodic")
  const clip = createMidiClip(0)
  clip.notes = notes
  const track: MidiTrack = { ...base, name, instrumentId, clips: [clip] }
  return { ...project, timeline: [...project.timeline, track] }
}

/** Replaces notes in the first clip of an existing melodic track. */
export function replaceTrackNotes(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => {
    const clip = track.clips[0] ?? createMidiClip(0)
    return { ...track, clips: [{ ...clip, notes }] }
  })
}

export function bakeOrReplaceTrackNotes(
  project: MusicalProject,
  name: string,
  instrumentId: string,
  notes: MidiRecordedNote[],
): [MusicalProject, string] {
  const existing = getMidiTracks(project.timeline).find(
    (track) => track.trackType === "melodic" && track.name === name,
  )
  if (existing) {
    return [replaceTrackNotes(project, existing.id, notes), existing.id]
  }
  const updated = appendTrackWithNotes(project, name, instrumentId, notes)
  const newTrack = getMidiTracks(updated.timeline)
    .filter((track) => track.trackType === "melodic")
    .at(-1)!
  return [updated, newTrack.id]
}

export function removeTrack(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.filter((track) => track.id !== trackId),
  }
}
