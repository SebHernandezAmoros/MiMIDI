import { describe, expect, it, vi } from "vitest"
import { createSynthVoiceEngine } from "../synthVoiceEngine"

function createGainNode() {
  return {
    disconnect: vi.fn(),
    gain: {
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
    },
  }
}

function createVoiceNodes() {
  const source = {
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
    stop: vi.fn(),
  }
  const gainNode = createGainNode()
  const panNode = {
    disconnect: vi.fn(),
  }
  const lfoSource = {
    disconnect: vi.fn(),
    stop: vi.fn(),
  }
  const lfoGainNode = {
    disconnect: vi.fn(),
  }

  return {
    gainNode,
    lfoGainNode,
    lfoSource,
    panNode,
    source,
  }
}

describe("createSynthVoiceEngine", () => {
  it("schedules the current default ADSR envelope", () => {
    const engine = createSynthVoiceEngine()
    const gainNode = createGainNode()

    const result = engine.scheduleVoiceStart(
      gainNode as unknown as GainNode,
      0.5,
      undefined,
      10,
    )

    expect(result.envelope).toEqual({
      attack: 0.01,
      decay: 0.12,
      sustain: 0.72,
      release: 0.18,
    })
    expect(result.sustainVolume).toBeCloseTo(0.36)
    expect(gainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10)
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.0001, 10)
    expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      1,
      0.5,
      10.01,
    )
    expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      2,
      0.36,
      10.129999999999999,
    )
  })

  it("releases and cleans a registered voice only once", () => {
    const engine = createSynthVoiceEngine()
    const nodes = createVoiceNodes()
    const voiceId = engine.createVoiceId()

    engine.registerActiveVoice({
      envelope: { attack: 0, decay: 0, sustain: 0.6, release: 0.4 },
      gainNode: nodes.gainNode as unknown as GainNode,
      lfoNodes: {
        gainNode: nodes.lfoGainNode as unknown as GainNode,
        source: nodes.lfoSource as unknown as OscillatorNode,
      },
      panNode: nodes.panNode as unknown as StereoPannerNode,
      source: nodes.source as unknown as OscillatorNode,
      sustainVolume: 0.3,
      voiceId,
    })

    engine.scheduleVoiceStop(voiceId, 5)

    expect(voiceId).toBe("voice-0")
    expect(nodes.gainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(5)
    expect(nodes.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 5)
    expect(nodes.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.0001,
      5.4,
    )
    expect(nodes.source.stop).toHaveBeenCalledWith(5.4)
    expect(nodes.lfoSource.stop).toHaveBeenCalledWith(5.4)

    nodes.source.onended?.()
    engine.scheduleVoiceStop(voiceId, 8)

    expect(nodes.source.disconnect).toHaveBeenCalledOnce()
    expect(nodes.gainNode.disconnect).toHaveBeenCalledOnce()
    expect(nodes.panNode.disconnect).toHaveBeenCalledOnce()
    expect(nodes.lfoSource.disconnect).toHaveBeenCalledOnce()
    expect(nodes.lfoGainNode.disconnect).toHaveBeenCalledOnce()
    expect(nodes.source.stop).toHaveBeenCalledOnce()
  })

  it("releases every active voice from the same start time", () => {
    const engine = createSynthVoiceEngine()
    const first = createVoiceNodes()
    const second = createVoiceNodes()

    engine.registerActiveVoice({
      envelope: { attack: 0, decay: 0, sustain: 1, release: 0.2 },
      gainNode: first.gainNode as unknown as GainNode,
      panNode: first.panNode as unknown as StereoPannerNode,
      source: first.source as unknown as OscillatorNode,
      sustainVolume: 0.4,
      voiceId: engine.createVoiceId(),
    })
    engine.registerActiveVoice({
      envelope: { attack: 0, decay: 0, sustain: 1, release: 0.5 },
      gainNode: second.gainNode as unknown as GainNode,
      panNode: second.panNode as unknown as StereoPannerNode,
      source: second.source as unknown as AudioBufferSourceNode,
      sustainVolume: 0.6,
      voiceId: engine.createVoiceId(),
    })

    engine.stopAllVoices(8)

    expect(first.source.stop).toHaveBeenCalledWith(8.2)
    expect(second.source.stop).toHaveBeenCalledWith(8.5)
  })
})
