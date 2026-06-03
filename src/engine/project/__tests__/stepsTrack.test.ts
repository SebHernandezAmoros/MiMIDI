import { describe, expect, it } from "vitest"
import {
  appendStepsTrack,
  bakeOrReplaceTrackNotes,
  createDefaultProject,
  getMidiTracks,
  resetTrackClips,
  toggleStepNoteInTrack,
} from "../projectModel"

// ─────────────────────────────────────────────────────────────────────────────
// appendStepsTrack
// ─────────────────────────────────────────────────────────────────────────────

describe("createDefaultProject", () => {
  it("incluye Track 1, Pad 1 y Steps 1 por defecto", () => {
    const p = createDefaultProject()
    const tracks = getMidiTracks(p.timeline)
    expect(tracks.find(t => t.trackType === "melodic")).toBeDefined()
    expect(tracks.find(t => t.trackType === "percussion")).toBeDefined()
    expect(tracks.find(t => t.trackType === "steps")).toBeDefined()
  })

  it("el steps track por defecto se llama 'Steps 1'", () => {
    const p = createDefaultProject()
    const stepsTrack = getMidiTracks(p.timeline).find(t => t.trackType === "steps")!
    expect(stepsTrack.name).toBe("Steps 1")
  })
})

describe("appendStepsTrack", () => {
  it("agrega un steps track al final del timeline", () => {
    const p0 = createDefaultProject()
    const p1 = appendStepsTrack(p0)
    const tracks = getMidiTracks(p1.timeline)
    const last = tracks.at(-1)!
    expect(last.trackType).toBe("steps")
  })

  it("el nombre sigue la secuencia Steps N", () => {
    const p0 = createDefaultProject()
    const p1 = appendStepsTrack(p0)
    const p2 = appendStepsTrack(p1)
    const stepsTracks = getMidiTracks(p2.timeline).filter(t => t.trackType === "steps")
    expect(stepsTracks[0].name).toBe("Steps 1")
    expect(stepsTracks[1].name).toBe("Steps 2")
  })

  it("no afecta los tracks melódicos ni de percusión existentes", () => {
    const p0 = createDefaultProject()
    const melodicCountBefore = getMidiTracks(p0.timeline).filter(t => t.trackType === "melodic").length
    const percCountBefore = getMidiTracks(p0.timeline).filter(t => t.trackType === "percussion").length
    const p1 = appendStepsTrack(p0)
    expect(getMidiTracks(p1.timeline).filter(t => t.trackType === "melodic").length).toBe(melodicCountBefore)
    expect(getMidiTracks(p1.timeline).filter(t => t.trackType === "percussion").length).toBe(percCountBefore)
  })

  it("el nuevo track empieza sin clips (se crean en el primer toggle)", () => {
    const p0 = createDefaultProject()
    const p1 = appendStepsTrack(p0)
    const stepsTrack = getMidiTracks(p1.timeline).find(t => t.trackType === "steps")!
    expect(stepsTrack.clips).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toggleStepNoteInTrack
// ─────────────────────────────────────────────────────────────────────────────

describe("toggleStepNoteInTrack", () => {
  function setup() {
    const p0 = appendStepsTrack(createDefaultProject())
    const track = getMidiTracks(p0.timeline).find(t => t.trackType === "steps")!
    return { project: p0, trackId: track.id }
  }

  it("añade una nota al activar un paso vacío", () => {
    const { project, trackId } = setup()
    const p1 = toggleStepNoteInTrack(project, trackId, "C4", 0, 120, "pure-sine")
    const track = getMidiTracks(p1.timeline).find(t => t.id === trackId)!
    expect(track.clips[0].notes).toHaveLength(1)
    expect(track.clips[0].notes[0].note).toBe("C4")
  })

  it("elimina la nota al activar el mismo paso dos veces", () => {
    const { project, trackId } = setup()
    const p1 = toggleStepNoteInTrack(project, trackId, "C4", 0, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, trackId, "C4", 0, 120, "pure-sine")
    const track = getMidiTracks(p2.timeline).find(t => t.id === trackId)!
    expect(track.clips[0].notes).toHaveLength(0)
  })

  it("notas distintas en el mismo paso coexisten", () => {
    const { project, trackId } = setup()
    const p1 = toggleStepNoteInTrack(project, trackId, "C4", 0, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, trackId, "G4", 0, 120, "pure-sine")
    const notes = getMidiTracks(p2.timeline).find(t => t.id === trackId)!.clips[0].notes
    expect(notes).toHaveLength(2)
  })

  it("el startTime de la nota es colIdx * stepDurationSec", () => {
    const { project, trackId } = setup()
    const bpm = 120
    const subdivision = 4
    const stepDuration = (60 / bpm) / subdivision
    const colIdx = 3
    const p1 = toggleStepNoteInTrack(project, trackId, "E4", colIdx, bpm, "pure-sine", subdivision)
    const note = getMidiTracks(p1.timeline).find(t => t.id === trackId)!.clips[0].notes[0]
    expect(note.startTime).toBeCloseTo(colIdx * stepDuration, 5)
  })

  it("respeta stepSubdivision=2 (corcheas)", () => {
    const { project, trackId } = setup()
    const bpm = 120
    const subdivision = 2  // 1/8 nota
    const stepDuration = (60 / bpm) / subdivision  // 0.25s
    const p1 = toggleStepNoteInTrack(project, trackId, "D4", 2, bpm, "pure-sine", subdivision)
    const note = getMidiTracks(p1.timeline).find(t => t.id === trackId)!.clips[0].notes[0]
    expect(note.startTime).toBeCloseTo(2 * stepDuration, 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// resetTrackClips
// ─────────────────────────────────────────────────────────────────────────────

describe("resetTrackClips", () => {
  it("borra todas las notas del steps track", () => {
    const p0 = appendStepsTrack(createDefaultProject())
    const track = getMidiTracks(p0.timeline).find(t => t.trackType === "steps")!
    const p1 = toggleStepNoteInTrack(p0, track.id, "C4", 0, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, track.id, "G4", 2, 120, "pure-sine")
    const p3 = resetTrackClips(p2, track.id)
    const cleared = getMidiTracks(p3.timeline).find(t => t.id === track.id)!
    expect(cleared.clips[0].notes).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// bakeOrReplaceTrackNotes
// ─────────────────────────────────────────────────────────────────────────────

describe("bakeOrReplaceTrackNotes", () => {
  const fakeNote = (note: string, start: number) => ({
    id: `n-${note}`,
    note: note as import("../../midi/notes").MusicalNote,
    startTime: start,
    duration: 0.1,
    velocity: 0.8,
    instrumentId: "pure-sine" as import("../../audio/mathematicalInstruments").MathematicalInstrumentId,
  })

  it("crea un nuevo track melódico si no existe uno con ese nombre", () => {
    const p0 = createDefaultProject()
    const melodicsBefore = getMidiTracks(p0.timeline).filter(t => t.trackType === "melodic").length
    const [p1] = bakeOrReplaceTrackNotes(p0, "Steps 1", "pure-sine", [fakeNote("C4", 0)])
    const melodicsAfter = getMidiTracks(p1.timeline).filter(t => t.trackType === "melodic").length
    expect(melodicsAfter).toBe(melodicsBefore + 1)
  })

  it("segunda llamada reemplaza notas en el mismo track, no crea uno nuevo", () => {
    const p0 = createDefaultProject()
    const [p1, id1] = bakeOrReplaceTrackNotes(p0, "Steps 1", "pure-sine", [fakeNote("C4", 0)])
    const [p2, id2] = bakeOrReplaceTrackNotes(p1, "Steps 1", "pure-sine", [fakeNote("G4", 0), fakeNote("E4", 0.125)])

    expect(id1).toBe(id2)  // mismo track
    const melodics = getMidiTracks(p2.timeline).filter(t => t.trackType === "melodic")
    const bakedTrack = melodics.find(t => t.id === id1)!
    expect(bakedTrack.clips[0].notes).toHaveLength(2)
    expect(bakedTrack.clips[0].notes.map(n => n.note)).toContain("G4")
  })

  it("devuelve el id del track existente cuando reemplaza", () => {
    const p0 = createDefaultProject()
    const [p1, id1] = bakeOrReplaceTrackNotes(p0, "Mi Patrón", "pure-sine", [fakeNote("C4", 0)])
    const [, id2] = bakeOrReplaceTrackNotes(p1, "Mi Patrón", "pure-sine", [fakeNote("D4", 0)])
    expect(id1).toBe(id2)
  })

  it("tracks con nombres distintos crean tracks distintos", () => {
    const p0 = createDefaultProject()
    const [p1] = bakeOrReplaceTrackNotes(p0, "Steps 1", "pure-sine", [fakeNote("C4", 0)])
    const [p2] = bakeOrReplaceTrackNotes(p1, "Steps 2", "pure-sine", [fakeNote("G4", 0)])
    const melodics = getMidiTracks(p2.timeline).filter(t => t.trackType === "melodic")
    const names = melodics.map(t => t.name)
    expect(names).toContain("Steps 1")
    expect(names).toContain("Steps 2")
  })
})
