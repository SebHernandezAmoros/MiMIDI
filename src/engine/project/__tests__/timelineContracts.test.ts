import { describe, expect, it } from "vitest"
import {
  addAudioClipTrack,
  addSamplerMix,
  appendNotesToTrack,
  appendNoteToTrack,
  appendPadTrack,
  appendTrack,
  appendTrackWithNotes,
  bakeOrReplaceTrackNotes,
  clearAllTrackNotes,
  clearTrackNotes,
  compactTrackNotesStart,
  createRecordingClip,
  createDefaultProject,
  duplicateMidiClip,
  duplicateNoteInTrack,
  getAudioClipTracks,
  getMidiTracks,
  getSamplerTracks,
  getTracksTimelineLength,
  isAudioClipTrack,
  isSamplerTrack,
  parseImportedProject,
  removeMidiClip,
  removeNoteFromTrack,
  removeTrack,
  renameProject,
  renameTrack,
  replaceTrackNotes,
  resetProject,
  syncProjectTrackInstrumentsWithPluginCatalog,
  updateProjectPluginEnabled,
  updateProjectTrackTimelineDuration,
  updateAudioClipStartTime,
  updateMidiClipStartTime,
  updateNoteInTrack,
  updateSamplerClipStartTime,
  updateTrackEnvelope,
  updateTrackInstrument,
  updateTrackMuted,
  updateTrackNoteTimelineDuration,
  updateTrackPan,
  updateTrackSolo,
  updateTrackVolume,
  updateTrackVolumeAutomation,
} from "../projectModel"
import type { MidiRecordedNote } from "../../midi/events"
import type { SequencerPattern } from "../../audio/sequencerModel"

function createPattern(overrides: Partial<SequencerPattern> = {}): SequencerPattern {
  return {
    bpm: 120,
    lanes: [],
    stepsPerBar: 16,
    ...overrides,
  }
}

function createRecordedNote(
  overrides: Partial<MidiRecordedNote> = {},
): MidiRecordedNote {
  return {
    duration: 0.75,
    id: "note-c4",
    instrumentId: "pure-sine",
    note: "C4",
    playbackSource: "note",
    startTime: 0.25,
    velocity: 0.8,
    ...overrides,
  }
}

describe("timeline track contracts", () => {
  it("creates the default timeline with melodic, percussion, and steps midi tracks", () => {
    const project = createDefaultProject()
    const tracks = getMidiTracks(project.timeline)

    expect(tracks.map((track) => track.trackType)).toEqual([
      "melodic",
      "percussion",
      "steps",
    ])
    expect(project.trackTimelineDuration).toBeGreaterThan(0)
  })

  it("appends melodic and percussion tracks without removing existing track types", () => {
    const base = createDefaultProject()
    const withMelodic = appendTrack(base)
    const withPad = appendPadTrack(withMelodic)
    const tracks = getMidiTracks(withPad.timeline)

    expect(tracks.filter((track) => track.trackType === "melodic")).toHaveLength(2)
    expect(tracks.filter((track) => track.trackType === "percussion")).toHaveLength(2)
    expect(tracks.filter((track) => track.trackType === "steps")).toHaveLength(1)
  })

  it("creates sampler tracks with clips as timeline positions", () => {
    const pattern = createPattern({ bpm: 100, stepsPerBar: 8 })
    const project = addSamplerMix(createDefaultProject(), pattern, "Beat A")
    const [samplerTrack] = getSamplerTracks(project.timeline)

    expect(samplerTrack.name).toBe("Beat A")
    expect(samplerTrack.clips).toHaveLength(1)
    expect(samplerTrack.clips[0].startTime).toBe(0)
    expect(samplerTrack.pattern).toEqual(pattern)
  })

  it("creates audio clip tracks with clips as timeline positions", () => {
    const project = addAudioClipTrack(createDefaultProject(), {
      dbId: "sample-1",
      duration: 2.5,
      name: "Rendered clip",
    })
    const [audioTrack] = getAudioClipTracks(project.timeline)

    expect(audioTrack.name).toBe("Rendered clip")
    expect(audioTrack.dbId).toBe("sample-1")
    expect(audioTrack.duration).toBe(2.5)
    expect(audioTrack.clips).toHaveLength(1)
    expect(audioTrack.clips[0].startTime).toBe(0)
  })

  it("clamps sampler and audio clip start times to zero", () => {
    const pattern = createPattern()
    const withSampler = addSamplerMix(createDefaultProject(), pattern, "Beat A")
    const samplerTrack = getSamplerTracks(withSampler.timeline)[0]
    const samplerClip = samplerTrack.clips[0]
    const samplerMoved = updateSamplerClipStartTime(
      withSampler,
      samplerTrack.id,
      samplerClip.id,
      -10,
    )

    const withAudio = addAudioClipTrack(samplerMoved, {
      dbId: "sample-1",
      duration: 1,
      name: "Clip A",
    })
    const audioTrack = getAudioClipTracks(withAudio.timeline)[0]
    const audioClip = audioTrack.clips[0]
    const audioMoved = updateAudioClipStartTime(
      withAudio,
      audioTrack.id,
      audioClip.id,
      -10,
    )

    expect(getSamplerTracks(samplerMoved.timeline)[0].clips[0].startTime).toBe(0)
    expect(getAudioClipTracks(audioMoved.timeline)[0].clips[0].startTime).toBe(0)
  })

  it("clamps midi clip start times to zero", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const withNotes = replaceTrackNotes(project, midiTrack.id, [
      createRecordedNote(),
    ])
    const midiClip = getMidiTracks(withNotes.timeline)[0].clips[0]

    const moved = updateMidiClipStartTime(
      withNotes,
      midiTrack.id,
      midiClip.id,
      -10,
    )

    expect(getMidiTracks(moved.timeline)[0].clips[0].startTime).toBe(0)
  })

  it("duplicates, removes, and records midi clips without mutating other tracks", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const withNotes = replaceTrackNotes(project, midiTrack.id, [
      createRecordedNote(),
    ])
    const sourceClip = getMidiTracks(withNotes.timeline)[0].clips[0]

    const duplicated = duplicateMidiClip(withNotes, midiTrack.id, sourceClip.id)
    const duplicatedTrack = getMidiTracks(duplicated.timeline)[0]

    expect(duplicatedTrack.clips).toHaveLength(2)
    expect(duplicatedTrack.clips[1].startTime).toBe(1)
    expect(duplicatedTrack.clips[1].notes).toHaveLength(1)
    expect(duplicatedTrack.clips[1].notes[0].id).toContain("note-c4-dup-")

    const removed = removeMidiClip(
      duplicated,
      midiTrack.id,
      duplicatedTrack.clips[1].id,
    )

    expect(getMidiTracks(removed.timeline)[0].clips).toHaveLength(1)

    const recordingReady = createRecordingClip(removed, midiTrack.id)
    const recordingTrack = getMidiTracks(recordingReady.timeline)[0]

    expect(recordingTrack.clips).toHaveLength(2)
    expect(recordingTrack.clips[1].startTime).toBe(1)
  })

  it("appends single and batch midi notes into the last clip", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const firstNote = createRecordedNote({ id: "note-1", note: "C4" })
    const secondNote = createRecordedNote({ id: "note-2", note: "D4" })
    const thirdNote = createRecordedNote({ id: "note-3", note: "E4" })

    const withFirst = appendNoteToTrack(project, midiTrack.id, firstNote)
    const withBatch = appendNotesToTrack(withFirst, midiTrack.id, [
      secondNote,
      thirdNote,
    ])
    const notes = getMidiTracks(withBatch.timeline)[0].clips[0].notes

    expect(notes.map((note) => note.id)).toEqual([
      "note-3",
      "note-2",
      "note-1",
    ])
  })

  it("updates, duplicates, removes, and clears midi notes", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const withNotes = replaceTrackNotes(project, midiTrack.id, [
      createRecordedNote({ id: "note-a", startTime: 0.01 }),
      createRecordedNote({ id: "note-b", note: "D4", startTime: 1 }),
    ])

    const updated = updateNoteInTrack(withNotes, midiTrack.id, "note-a", {
      duration: 1.25,
      startTime: 0.5,
    })
    const updatedNotes = getMidiTracks(updated.timeline)[0].clips[0].notes

    expect(updatedNotes.find((note) => note.id === "note-a")?.duration).toBe(1.25)
    expect(updatedNotes.find((note) => note.id === "note-a")?.startTime).toBe(0.5)

    const duplicated = duplicateNoteInTrack(updated, midiTrack.id, "note-a", -1)
    const duplicatedNotes = getMidiTracks(duplicated.timeline)[0].clips[0].notes

    expect(duplicatedNotes).toHaveLength(3)
    expect(duplicatedNotes[0].id).toContain("note-C4-")
    expect(duplicatedNotes[0].startTime).toBe(0)

    const removed = removeNoteFromTrack(duplicated, midiTrack.id, "note-b")
    const remainingNotes = getMidiTracks(removed.timeline)[0].clips[0].notes

    expect(remainingNotes.some((note) => note.id === "note-b")).toBe(false)

    const clearedTrack = clearTrackNotes(removed, midiTrack.id)
    expect(getMidiTracks(clearedTrack.timeline)[0].clips[0].notes).toEqual([])

    const withNotesAgain = replaceTrackNotes(clearedTrack, midiTrack.id, [
      createRecordedNote({ id: "note-c" }),
    ])
    const clearedAll = clearAllTrackNotes(withNotesAgain)

    expect(
      getMidiTracks(clearedAll.timeline).every((track) =>
        track.clips.every((clip) => clip.notes.length === 0),
      ),
    ).toBe(true)
  })

  it("updates project and midi track metadata with clamped values", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]

    const renamedProject = renameProject(project, "New Project")
    const resizedProjectTimeline = updateProjectTrackTimelineDuration(
      renamedProject,
      -10,
    )
    const renamedTrack = renameTrack(
      resizedProjectTimeline,
      midiTrack.id,
      "Lead",
    )
    const resizedNoteTimeline = updateTrackNoteTimelineDuration(
      renamedTrack,
      midiTrack.id,
      10000,
    )
    const updatedInstrument = updateTrackInstrument(
      resizedNoteTimeline,
      midiTrack.id,
      "fm-bell",
    )
    const updatedEnvelope = updateTrackEnvelope(updatedInstrument, midiTrack.id, {
      attack: 0.5,
    })
    const loudTrack = updateTrackVolume(updatedEnvelope, midiTrack.id, 10)
    const pannedTrack = updateTrackPan(loudTrack, midiTrack.id, -10)
    const mutedTrack = updateTrackMuted(pannedTrack, midiTrack.id, true)
    const soloTrack = updateTrackSolo(mutedTrack, midiTrack.id, true)
    const automatedTrack = updateTrackVolumeAutomation(soloTrack, midiTrack.id, {
      enabled: true,
      points: [
        { time: 4, value: 0.4 },
        { time: 1, value: 1 },
      ],
    })
    const track = getMidiTracks(automatedTrack.timeline)[0]

    expect(automatedTrack.name).toBe("New Project")
    expect(automatedTrack.trackTimelineDuration).toBe(1)
    expect(track.name).toBe("Lead")
    expect(track.noteTimelineDuration).toBe(9999)
    expect(track.instrumentId).toBe("fm-bell")
    expect(track.envelope.attack).toBe(0.5)
    expect(track.volume).toBe(1.5)
    expect(track.pan).toBe(-1)
    expect(track.muted).toBe(true)
    expect(track.solo).toBe(true)
    expect(track.volumeAutomation.points.map((point) => point.time)).toEqual([
      1,
      4,
    ])
  })

  it("compacts midi notes in the last clip to start at zero", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const withNotes = replaceTrackNotes(project, midiTrack.id, [
      createRecordedNote({ id: "late-a", startTime: 2 }),
      createRecordedNote({ id: "late-b", startTime: 3 }),
    ])

    const compacted = compactTrackNotesStart(withNotes, midiTrack.id)
    const notes = getMidiTracks(compacted.timeline)[0].clips[0].notes

    expect(notes.map((note) => note.startTime)).toEqual([0, 1])
  })

  it("creates, bakes, removes, and resets lifecycle tracks", () => {
    const project = createDefaultProject()
    const renderedNote = createRecordedNote({ id: "rendered-note" })
    const withRenderedTrack = appendTrackWithNotes(
      project,
      "Rendered Lead",
      "pure-sine",
      [renderedNote],
    )
    const renderedTrack = getMidiTracks(withRenderedTrack.timeline).at(-1)

    expect(renderedTrack?.name).toBe("Rendered Lead")
    expect(renderedTrack?.clips[0].notes).toEqual([renderedNote])

    const replaced = replaceTrackNotes(
      withRenderedTrack,
      renderedTrack!.id,
      [createRecordedNote({ id: "replacement-note", note: "D4" })],
    )

    expect(
      getMidiTracks(replaced.timeline).find((track) => track.id === renderedTrack!.id)
        ?.clips[0].notes.map((note) => note.id),
    ).toEqual(["replacement-note"])

    const [bakedNew, bakedNewId] = bakeOrReplaceTrackNotes(
      replaced,
      "Baked Pattern",
      "pure-sine",
      [createRecordedNote({ id: "baked-note" })],
    )
    const [bakedReplaced, bakedReplacedId] = bakeOrReplaceTrackNotes(
      bakedNew,
      "Baked Pattern",
      "pure-sine",
      [createRecordedNote({ id: "baked-replacement" })],
    )

    expect(bakedReplacedId).toBe(bakedNewId)
    expect(
      getMidiTracks(bakedReplaced.timeline).find((track) => track.id === bakedNewId)
        ?.clips[0].notes.map((note) => note.id),
    ).toEqual(["baked-replacement"])

    const withoutRendered = removeTrack(bakedReplaced, renderedTrack!.id)
    expect(
      withoutRendered.timeline.some((track) => track.id === renderedTrack!.id),
    ).toBe(false)

    const reset = resetProject({ ...withoutRendered, id: "keep-id" })

    expect(reset.id).toBe("keep-id")
    expect(getMidiTracks(reset.timeline).map((track) => track.trackType)).toEqual([
      "melodic",
      "percussion",
      "steps",
    ])
  })

  it("keeps plugin defaults and syncs unavailable track instruments", () => {
    const project = createDefaultProject()
    const midiTrack = getMidiTracks(project.timeline)[0]
    const withUnavailableInstrument = updateTrackInstrument(
      project,
      midiTrack.id,
      "missing-instrument",
    )

    const synced = syncProjectTrackInstrumentsWithPluginCatalog(
      withUnavailableInstrument,
    )
    const syncedTrack = getMidiTracks(synced.timeline)[0]

    expect(project.pluginStates).toEqual({})
    expect(syncedTrack.instrumentId).toBe("pure-sine")

    const afterPluginToggle = updateProjectPluginEnabled(
      withUnavailableInstrument,
      "unknown-plugin",
      true,
    )
    const pluginSyncedTrack = getMidiTracks(afterPluginToggle.timeline)[0]

    expect(afterPluginToggle.pluginStates["unknown-plugin"]).toBe(true)
    expect(pluginSyncedTrack.instrumentId).toBe("pure-sine")
  })

  it("calculates timeline length across midi, sampler, and audio clip tracks", () => {
    const pattern = createPattern({ bpm: 120, stepsPerBar: 16 })
    const withSampler = addSamplerMix(createDefaultProject(), pattern, "Beat A")
    const samplerTrack = getSamplerTracks(withSampler.timeline)[0]
    const samplerMoved = updateSamplerClipStartTime(
      withSampler,
      samplerTrack.id,
      samplerTrack.clips[0].id,
      3,
    )
    const withAudio = addAudioClipTrack(samplerMoved, {
      dbId: "sample-1",
      duration: 4,
      name: "Clip A",
    })
    const audioTrack = getAudioClipTracks(withAudio.timeline)[0]
    const audioMoved = updateAudioClipStartTime(
      withAudio,
      audioTrack.id,
      audioTrack.clips[0].id,
      5,
    )

    expect(getTracksTimelineLength(audioMoved.timeline)).toBe(9)
  })

  it("parses legacy audio clip tracks that stored startTime on the track", () => {
    const legacyProject = {
      id: "project-legacy",
      name: "Legacy Project",
      timeline: [
        {
          dbId: "sample-legacy",
          duration: 2,
          id: "audio-legacy",
          kind: "audio-clip",
          muted: false,
          name: "Legacy audio",
          startTime: 4,
        },
      ],
      trackTimelineDuration: 8,
    }

    const parsed = parseImportedProject(JSON.stringify(legacyProject))
    const audioTrack = parsed.timeline.find(isAudioClipTrack)

    expect(audioTrack).toBeDefined()
    expect(audioTrack?.clips).toHaveLength(1)
    expect(audioTrack?.clips[0].startTime).toBe(4)
  })

  it("parses legacy midi tracks and normalizes defaults", () => {
    const legacyProject = {
      id: "project-legacy-midi",
      name: "Legacy MIDI",
      tracks: [
        {
          envelope: { attack: 0.1 },
          id: "legacy-midi",
          instrumentId: "pure-sine",
          muted: true,
          name: "Legacy Track",
          notes: [createRecordedNote({ id: "legacy-note", startTime: 2 })],
          pan: 4,
          startTime: 3,
          trackType: "steps",
          volumeAutomation: {
            enabled: true,
            points: [
              { time: 4, value: 3 },
              { time: -2, value: -1 },
            ],
          },
        },
      ],
      trackTimelineDuration: 0,
    }

    const parsed = parseImportedProject(JSON.stringify(legacyProject))
    const track = getMidiTracks(parsed.timeline)[0]

    expect(parsed.trackTimelineDuration).toBe(1)
    expect(track.trackType).toBe("steps")
    expect(track.clips[0].startTime).toBe(3)
    expect(track.clips[0].notes[0].id).toBe("legacy-note")
    expect(track.envelope).toEqual({
      attack: 0.1,
      decay: 0.12,
      sustain: 0.68,
      release: 0.24,
    })
    expect(track.pan).toBe(1)
    expect(track.muted).toBe(true)
    expect(track.volumeAutomation.points).toEqual([
      { time: 0, value: 0 },
      { time: 4, value: 1.5 },
    ])
  })

  it("parses legacy sampler mixes into sampler timeline tracks", () => {
    const pattern = createPattern({ bpm: 90 })
    const legacyProject = {
      id: "project-legacy-sampler",
      name: "Legacy Sampler",
      samplerMixes: [
        {
          id: "mix-legacy",
          muted: true,
          name: "Legacy Beat",
          pattern,
          startTime: 6,
        },
      ],
      tracks: [],
    }

    const parsed = parseImportedProject(JSON.stringify(legacyProject))
    const samplerTrack = parsed.timeline.find(isSamplerTrack)

    expect(samplerTrack?.clips[0].startTime).toBe(6)
    expect(samplerTrack?.muted).toBe(true)
    expect(samplerTrack?.pattern).toEqual(pattern)
  })

  it("rejects invalid imported project JSON", () => {
    expect(() => parseImportedProject("null")).toThrow("Invalid project file")
    expect(() =>
      parseImportedProject(JSON.stringify({ id: "missing-shape", name: "Bad" })),
    ).toThrow("Project JSON does not match MiMIDI format")
  })
})
