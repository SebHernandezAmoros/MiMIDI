import { describe, expect, it, vi } from "vitest"
import { defaultArpeggiatorSettings } from "../../../engine/midi/arpeggiator"
import { startArpeggiatorPlayback } from "../arpeggiatorPlayback"

describe("arpeggiator playback use-case", () => {
  it("schedules steps through an injected timer port", () => {
    const scheduled: Array<{ callback: () => void; id: number }> = []
    const timerPort = {
      setTimeout: vi.fn((callback: () => void, delayMs: number) => {
        const id = scheduled.length + 1
        scheduled.push({ callback, id })
        expect(delayMs).toBe(300)
        return id
      }),
      clearTimeout: vi.fn(),
    }
    const onStep = vi.fn()
    const onComplete = vi.fn()

    const handle = startArpeggiatorPlayback({
      maxSteps: 2,
      onComplete,
      onStep,
      settings: { ...defaultArpeggiatorSettings, enabled: true, rate: "1/8" },
      sourceNotes: ["C4"],
      timerPort,
    })

    expect(onStep).toHaveBeenCalledTimes(1)
    expect(timerPort.setTimeout).toHaveBeenCalledTimes(1)

    scheduled[0].callback()

    expect(onStep).toHaveBeenCalledTimes(2)
    expect(onComplete).toHaveBeenCalledTimes(1)

    handle.stop()

    expect(timerPort.clearTimeout).toHaveBeenCalledWith(1)
  })
})
