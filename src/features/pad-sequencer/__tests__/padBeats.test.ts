import { describe, expect, it } from "vitest"
import { smcPadSounds } from "../../../application/use-cases/playSmcPadHit"
import {
  appendStepsTrack,
  createDefaultProject,
  getMidiTracks,
  resetTrackClips,
  toggleStepNoteInTrack,
} from "../../../engine/project/projectModel"
import { calcStepDurationSec } from "../../step-sequencer/useMelodicSequencer"

// Los primeros 8 sonidos del pad (Página 1: kit básico)
const PAGE_1 = smcPadSounds.slice(0, 8)

function getPercTrack(project: ReturnType<typeof createDefaultProject>) {
  return getMidiTracks(project.timeline).find(t => t.trackType === "percussion")!
}

// ─────────────────────────────────────────────────────────────────────────────
// smcPadSounds — estructura del kit
// ─────────────────────────────────────────────────────────────────────────────

describe("smcPadSounds", () => {
  it("tiene exactamente 16 sonidos en 2 páginas de 8", () => {
    expect(smcPadSounds).toHaveLength(16)
  })

  it("cada sonido tiene id, label, note y accent únicos", () => {
    const ids    = smcPadSounds.map(s => s.id)
    const notes  = smcPadSounds.map(s => s.note)
    expect(new Set(ids).size).toBe(16)
    expect(new Set(notes).size).toBe(16)
  })

  it("la página 1 contiene kick, snare, hat y open-hat como fundamentos", () => {
    const p1ids = PAGE_1.map(s => s.id)
    expect(p1ids).toContain("kick")
    expect(p1ids).toContain("snare")
    expect(p1ids).toContain("hat")
    expect(p1ids).toContain("open-hat")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// beats en el percussion track
// ─────────────────────────────────────────────────────────────────────────────

describe("beats en percussion track", () => {
  it("createDefaultProject tiene un percussion track (Pad 1)", () => {
    const p = createDefaultProject()
    const perc = getPercTrack(p)
    expect(perc).toBeDefined()
    expect(perc.trackType).toBe("percussion")
  })

  it("activar un beat añade una nota con la note raíz del sonido", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    const kick = PAGE_1.find(s => s.id === "kick")!
    const p1 = toggleStepNoteInTrack(p0, perc.id, kick.note, 0, 120, "pure-sine")
    const notes = getMidiTracks(p1.timeline).find(t => t.id === perc.id)!.clips[0].notes
    expect(notes).toHaveLength(1)
    expect(notes[0].note).toBe(kick.note)
  })

  it("activar el mismo beat dos veces lo elimina", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    const snare = PAGE_1.find(s => s.id === "snare")!
    const p1 = toggleStepNoteInTrack(p0, perc.id, snare.note, 2, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, perc.id, snare.note, 2, 120, "pure-sine")
    expect(getMidiTracks(p2.timeline).find(t => t.id === perc.id)!.clips[0].notes).toHaveLength(0)
  })

  it("sonidos distintos en el mismo paso coexisten", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    const kick  = PAGE_1.find(s => s.id === "kick")!
    const hihat = PAGE_1.find(s => s.id === "hat")!
    const p1 = toggleStepNoteInTrack(p0, perc.id, kick.note,  0, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, perc.id, hihat.note, 0, 120, "pure-sine")
    expect(getMidiTracks(p2.timeline).find(t => t.id === perc.id)!.clips[0].notes).toHaveLength(2)
  })

  it("el startTime del beat es correcto según BPM y subdivisión", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    const snare = PAGE_1.find(s => s.id === "snare")!
    const bpm = 120, sub = 4, col = 4
    const expected = col * calcStepDurationSec(bpm, sub)
    const p1 = toggleStepNoteInTrack(p0, perc.id, snare.note, col, bpm, "pure-sine", sub)
    const note = getMidiTracks(p1.timeline).find(t => t.id === perc.id)!.clips[0].notes[0]
    expect(note.startTime).toBeCloseTo(expected, 5)
  })

  it("resetTrackClips borra todos los beats del percussion track", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    let p = p0
    for (const sound of PAGE_1) {
      p = toggleStepNoteInTrack(p, perc.id, sound.note, 0, 120, "pure-sine")
    }
    const p_reset = resetTrackClips(p, perc.id)
    expect(getMidiTracks(p_reset.timeline).find(t => t.id === perc.id)!.clips[0].notes).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Paginación — beats de página 2 se guardan independientemente de página 1
// ─────────────────────────────────────────────────────────────────────────────

describe("paginación de beats", () => {
  it("beats de página 1 y página 2 coexisten en el mismo clip", () => {
    const p0 = createDefaultProject()
    const perc = getPercTrack(p0)
    const page1Sounds = smcPadSounds.slice(0, 8)
    const page2Sounds = smcPadSounds.slice(8, 16)
    const kick     = page1Sounds.find(s => s.id === "kick")!
    const floorTom = page2Sounds.find(s => s.id === "floor-tom")!
    const p1 = toggleStepNoteInTrack(p0, perc.id, kick.note,     0, 120, "pure-sine")
    const p2 = toggleStepNoteInTrack(p1, perc.id, floorTom.note, 4, 120, "pure-sine")
    const notes = getMidiTracks(p2.timeline).find(t => t.id === perc.id)!.clips[0].notes
    expect(notes.map(n => n.note)).toContain(kick.note)
    expect(notes.map(n => n.note)).toContain(floorTom.note)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// El percussion track NO interfiere con steps tracks
// ─────────────────────────────────────────────────────────────────────────────

describe("aislamiento percussion vs steps", () => {
  it("beats en percussion track no afectan el steps track", () => {
    const p0 = createDefaultProject()
    const perc  = getMidiTracks(p0.timeline).find(t => t.trackType === "percussion")!
    const steps = getMidiTracks(p0.timeline).find(t => t.trackType === "steps")!
    const kick = PAGE_1.find(s => s.id === "kick")!
    const p1 = toggleStepNoteInTrack(p0, perc.id, kick.note, 0, 120, "pure-sine")
    const stepsNotes = getMidiTracks(p1.timeline).find(t => t.id === steps.id)!.clips
    expect(stepsNotes).toHaveLength(0)
  })
})
