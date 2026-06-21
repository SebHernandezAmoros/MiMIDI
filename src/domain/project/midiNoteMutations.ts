import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import type { MidiRecordedNote } from "../../engine/midi/events"
import type { MusicalNote } from "../../engine/midi/notes"
import { createMidiClip } from "./projectFactories"
import { isMidiTrack } from "./timelineQueries"
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

function ensureLastClip(track: MidiTrack): MidiTrack {
  if (track.clips.length > 0) return track
  return { ...track, clips: [createMidiClip(0)] }
}

export function appendNoteToTrack(
  project: MusicalProject,
  trackId: string,
  note: MidiRecordedNote,
): MusicalProject {
  return mapMidiTrack(project, trackId, (candidate) => {
    const track = ensureLastClip(candidate)
    const clips = track.clips.slice()
    const last = { ...clips[clips.length - 1] }
    last.notes = [note, ...last.notes]
    clips[clips.length - 1] = last
    return { ...track, clips }
  })
}

export function appendNotesToTrack(
  project: MusicalProject,
  trackId: string,
  notes: MidiRecordedNote[],
): MusicalProject {
  return mapMidiTrack(project, trackId, (candidate) => {
    const track = ensureLastClip(candidate)
    const clips = track.clips.slice()
    const last = { ...clips[clips.length - 1] }
    last.notes = [[...notes].reverse(), last.notes].flat()
    clips[clips.length - 1] = last
    return { ...track, clips }
  })
}

export function toggleStepNoteInTrack(
  project: MusicalProject,
  trackId: string,
  note: MusicalNote,
  colIdx: number,
  bpm: number,
  instrumentId: MathematicalInstrumentId,
  stepSubdivision = 4,
): MusicalProject {
  const stepDurationSec = 60 / bpm / stepSubdivision
  const noteDuration = stepDurationSec * 0.85
  const targetStartTime = colIdx * stepDurationSec
  const tolerance = stepDurationSec * 0.5

  return mapMidiTrack(project, trackId, (candidate) => {
    const track = ensureLastClip(candidate)
    const clip = track.clips[0]
    const existingIdx = clip.notes.findIndex(
      (recordedNote) =>
        recordedNote.note === note &&
        Math.abs(recordedNote.startTime - targetStartTime) < tolerance,
    )
    const newNotes =
      existingIdx >= 0
        ? clip.notes.filter((_, index) => index !== existingIdx)
        : [
            ...clip.notes,
            {
              id: `step-${note}-${colIdx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              note,
              startTime: targetStartTime,
              duration: noteDuration,
              velocity: 0.8,
              instrumentId,
            },
          ]
    return { ...track, clips: [{ ...clip, notes: newNotes }] }
  })
}

export function removeNoteFromTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) => ({
      ...clip,
      notes: clip.notes.filter((note) => note.id !== noteId),
    })),
  }))
}

export function updateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  patch: Partial<Pick<MidiRecordedNote, "startTime" | "duration">>,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) => ({
      ...clip,
      notes: clip.notes.map((note) =>
        note.id === noteId ? { ...note, ...patch } : note,
      ),
    })),
  }))
}

export function duplicateNoteInTrack(
  project: MusicalProject,
  trackId: string,
  noteId: string,
  offsetSeconds = 0.05,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) => {
      const sourceNote = clip.notes.find((note) => note.id === noteId)
      if (!sourceNote) return clip

      const copiedNote: MidiRecordedNote = {
        ...sourceNote,
        id: `note-${sourceNote.note}-${(sourceNote.startTime + offsetSeconds).toFixed(3)}-${Date.now()}`,
        startTime: Math.max(0, sourceNote.startTime + offsetSeconds),
      }
      return { ...clip, notes: [copiedNote, ...clip.notes] }
    }),
  }))
}

export function clearTrackNotes(
  project: MusicalProject,
  trackId: string,
): MusicalProject {
  return mapMidiTrack(project, trackId, (track) => ({
    ...track,
    clips: track.clips.map((clip) => ({ ...clip, notes: [] })),
  }))
}

export function clearAllTrackNotes(project: MusicalProject): MusicalProject {
  return {
    ...project,
    timeline: project.timeline.map((track) =>
      isMidiTrack(track)
        ? { ...track, clips: track.clips.map((clip) => ({ ...clip, notes: [] })) }
        : track,
    ),
  }
}
