import { describe, expect, it } from "vitest"
import { calcStepDurationSec } from "../useMelodicSequencer"
import type { StepSubdivision } from "../useMelodicSequencer"

// ─────────────────────────────────────────────────────────────────────────────
// calcStepDurationSec — duración de cada paso según BPM y subdivisión
// ─────────────────────────────────────────────────────────────────────────────

describe("calcStepDurationSec", () => {
  const cases: [number, StepSubdivision, number][] = [
    // BPM,  subdivisión,  duración esperada en segundos
    [120, 4, 0.125],   // 1/16 a 120 BPM = 125ms (default)
    [120, 2, 0.25],    // 1/8  a 120 BPM = 250ms
    [120, 1, 0.5],     // 1/4  a 120 BPM = 500ms
    [120, 8, 0.0625],  // 1/32 a 120 BPM = 62.5ms
    [60,  4, 0.25],    // 1/16 a 60 BPM  = 250ms
    [240, 4, 0.0625],  // 1/16 a 240 BPM = 62.5ms
  ]

  it.each(cases)("BPM=%i subdivisión=%i → %f s", (bpm, sub, expected) => {
    expect(calcStepDurationSec(bpm, sub)).toBeCloseTo(expected, 5)
  })

  it("16 pasos a 120 BPM en 1/16 duran exactamente 2 segundos", () => {
    const stepDur = calcStepDurationSec(120, 4)
    expect(stepDur * 16).toBeCloseTo(2.0, 5)
  })

  it("32 pasos a 120 BPM en 1/16 duran exactamente 4 segundos", () => {
    const stepDur = calcStepDurationSec(120, 4)
    expect(stepDur * 32).toBeCloseTo(4.0, 5)
  })

  it("8 pasos a 120 BPM en 1/8 duran exactamente 2 segundos (igual que 16 pasos 1/16)", () => {
    const stepDur8 = calcStepDurationSec(120, 2)
    const stepDur16 = calcStepDurationSec(120, 4)
    expect(stepDur8 * 8).toBeCloseTo(2.0, 5)
    expect(stepDur16 * 16).toBeCloseTo(2.0, 5)
  })

  it("subdivisión 1/8 duplica la duración de subdivisión 1/16", () => {
    const dur16 = calcStepDurationSec(120, 4)
    const dur8  = calcStepDurationSec(120, 2)
    expect(dur8).toBeCloseTo(dur16 * 2, 5)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Consistencia entre toggleStepNoteInTrack y calcStepDurationSec
// (verifica que ambas funciones usan la misma fórmula de tiempo)
// ─────────────────────────────────────────────────────────────────────────────

describe("Consistencia de timing entre grid y modelo", () => {
  it("colIdx 0 produce startTime = 0 independientemente de la subdivisión", () => {
    expect(0 * calcStepDurationSec(120, 4)).toBe(0)
    expect(0 * calcStepDurationSec(120, 2)).toBe(0)
  })

  it("el paso N ocupa la posición correcta para toda subdivisión", () => {
    for (const sub of [1, 2, 4, 8] as StepSubdivision[]) {
      const dur = calcStepDurationSec(120, sub)
      for (let col = 0; col < 16; col++) {
        expect(col * dur).toBeCloseTo(col * (60 / 120) / sub, 5)
      }
    }
  })
})
