import { describe, expect, it, vi } from "vitest"
import { createMasterOutput } from "../masterOutput"

function createContext() {
  const gain = {
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
  }
  const gainNode = {
    connect: vi.fn(),
    gain,
  }
  const context = {
    createGain: vi.fn(() => gainNode),
    currentTime: 7.5,
    destination: {},
  }

  return { context, gain, gainNode }
}

describe("masterOutput", () => {
  it("creates and initializes one master gain lazily", () => {
    const { context, gain, gainNode } = createContext()
    const getAudioContext = vi.fn(
      () => context as unknown as AudioContext,
    )
    const masterOutput = createMasterOutput({ getAudioContext })

    expect(context.createGain).not.toHaveBeenCalled()

    expect(masterOutput.getMasterGainNode()).toBe(gainNode)
    expect(masterOutput.getMasterGainNode()).toBe(gainNode)
    expect(context.createGain).toHaveBeenCalledTimes(1)
    expect(gain.setValueAtTime).toHaveBeenCalledWith(0.8, 7.5)
    expect(gainNode.connect).toHaveBeenCalledWith(context.destination)
  })

  it.each([
    { input: -0.4, expected: 0 },
    { input: 0.65, expected: 0.65 },
    { input: 1.4, expected: 1 },
  ])("clamps master volume $input to $expected", ({ input, expected }) => {
    const { context, gain } = createContext()
    const masterOutput = createMasterOutput({
      getAudioContext: () => context as unknown as AudioContext,
    })

    masterOutput.setMasterVolume(input)

    expect(gain.setTargetAtTime).toHaveBeenCalledWith(expected, 7.5, 0.01)
  })
})
