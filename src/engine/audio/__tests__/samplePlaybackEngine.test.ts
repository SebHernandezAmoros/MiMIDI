import { describe, expect, it, vi } from "vitest"
import type { AudioCalibration } from "../audioTypes"
import {
  playCalibratedSample,
  playSimpleSample,
  scheduleCalibratedSample,
  scheduleLoopingSample,
  scheduleSimpleSample,
} from "../samplePlaybackEngine"

function createCalibration(
  overrides: Partial<AudioCalibration> = {},
): AudioCalibration {
  return {
    fadeIn: 0,
    fadeOut: 0,
    gain: 1,
    trimEnd: 1,
    trimStart: 0,
    tune: 0,
    ...overrides,
  }
}

function createAudioContext(currentTime = 10) {
  const masterOutput = {} as AudioNode
  const panNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    pan: { value: 0 },
  }
  const gainNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      setValueAtTime: vi.fn(),
      value: 0,
    },
  }
  const source = {
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    loop: false,
    loopEnd: 0,
    loopStart: 0,
    onended: null as (() => void) | null,
    playbackRate: {
      setTargetAtTime: vi.fn(),
      value: 1,
    },
    start: vi.fn(),
    stop: vi.fn(),
  }
  const context = {
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gainNode),
    createStereoPanner: vi.fn(() => panNode),
    currentTime,
  } as unknown as BaseAudioContext

  return {
    context,
    gainNode,
    masterOutput,
    panNode,
    source,
  }
}

describe("playCalibratedSample", () => {
  it("connects and schedules a trimmed and tuned sample", () => {
    const audio = createAudioContext()
    const audioBuffer = { duration: 8 } as AudioBuffer

    const playback = playCalibratedSample(
      audio.context,
      audio.masterOutput,
      audioBuffer,
      createCalibration({
        gain: 3,
        trimEnd: 0.75,
        trimStart: 0.25,
        tune: 12,
      }),
      0.5,
      2,
    )

    expect(audio.panNode.pan.value).toBe(1)
    expect(audio.panNode.connect).toHaveBeenCalledWith(audio.masterOutput)
    expect(audio.gainNode.connect).toHaveBeenCalledWith(audio.panNode)
    expect(audio.source.connect).toHaveBeenCalledWith(audio.gainNode)
    expect(audio.source.buffer).toBe(audioBuffer)
    expect(audio.source.playbackRate.value).toBe(2)
    expect(audio.source.start).toHaveBeenCalledWith(10, 2)
    expect(audio.source.stop).toHaveBeenCalledWith(12)
    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1.5, 10)
    expect(audio.gainNode.gain.linearRampToValueAtTime).not.toHaveBeenCalled()
    expect(playback.realDurationMs).toBe(2000)
  })

  it("schedules the current fade-in and fade-out envelope", () => {
    const audio = createAudioContext()

    playCalibratedSample(
      audio.context,
      audio.masterOutput,
      { duration: 10 } as AudioBuffer,
      createCalibration({
        fadeIn: 2,
        fadeOut: 3,
        gain: 2,
      }),
      0.5,
    )

    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenNthCalledWith(
      1,
      0.0001,
      10,
    )
    expect(audio.gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      1,
      1,
      12,
    )
    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenNthCalledWith(
      2,
      1,
      17,
    )
    expect(audio.gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      2,
      0.0001,
      20,
    )
  })

  it("preserves stop, gain and tune controls", () => {
    const audio = createAudioContext()
    const playback = playCalibratedSample(
      audio.context,
      audio.masterOutput,
      { duration: 4 } as AudioBuffer,
      createCalibration({ gain: 3 }),
      0.5,
    )

    playback.stop()
    playback.setGain(10)
    playback.setTune(-12)

    expect(audio.source.stop).toHaveBeenLastCalledWith()
    expect(audio.gainNode.gain.setTargetAtTime).toHaveBeenCalledWith(
      4,
      10,
      0.015,
    )
    expect(audio.source.playbackRate.setTargetAtTime).toHaveBeenCalledWith(
      0.5,
      10,
      0.015,
    )
  })
})

describe("scheduleCalibratedSample", () => {
  it("connects and schedules from the requested absolute time", () => {
    const audio = createAudioContext()
    const audioBuffer = { duration: 8 } as AudioBuffer

    const source = scheduleCalibratedSample(
      audio.context,
      audio.masterOutput,
      audioBuffer,
      createCalibration({
        gain: 3,
        trimEnd: 0.75,
        trimStart: 0.25,
        tune: 12,
      }),
      20,
      0.5,
      -2,
    )

    expect(source).toBe(audio.source)
    expect(audio.panNode.pan.value).toBe(-1)
    expect(audio.panNode.connect).toHaveBeenCalledWith(audio.masterOutput)
    expect(audio.gainNode.connect).toHaveBeenCalledWith(audio.panNode)
    expect(audio.source.connect).toHaveBeenCalledWith(audio.gainNode)
    expect(audio.source.buffer).toBe(audioBuffer)
    expect(audio.source.playbackRate.value).toBe(2)
    expect(audio.source.start).toHaveBeenCalledWith(20, 2)
    expect(audio.source.stop).toHaveBeenCalledWith(22)
    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1.5, 20)
    expect(audio.gainNode.gain.linearRampToValueAtTime).not.toHaveBeenCalled()
  })

  it("anchors fades to the requested absolute time", () => {
    const audio = createAudioContext()

    scheduleCalibratedSample(
      audio.context,
      audio.masterOutput,
      { duration: 10 } as AudioBuffer,
      createCalibration({
        fadeIn: 2,
        fadeOut: 3,
        gain: 2,
      }),
      30,
      0.5,
    )

    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenNthCalledWith(
      1,
      0.0001,
      30,
    )
    expect(audio.gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      1,
      1,
      32,
    )
    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenNthCalledWith(
      2,
      1,
      37,
    )
    expect(audio.gainNode.gain.linearRampToValueAtTime).toHaveBeenNthCalledWith(
      2,
      0.0001,
      40,
    )
  })

  it("disconnects the scheduled source and its output chain on end", () => {
    const audio = createAudioContext()

    scheduleCalibratedSample(
      audio.context,
      audio.masterOutput,
      { duration: 4 } as AudioBuffer,
      createCalibration(),
      20,
    )
    audio.source.onended?.()

    expect(audio.source.disconnect).toHaveBeenCalledOnce()
    expect(audio.gainNode.disconnect).toHaveBeenCalledOnce()
    expect(audio.panNode.disconnect).toHaveBeenCalledOnce()
  })
})

describe("scheduleLoopingSample", () => {
  it("schedules the calibrated loop without fades or an automatic stop", () => {
    const audio = createAudioContext()
    const audioBuffer = { duration: 8 } as AudioBuffer

    const source = scheduleLoopingSample(
      audio.context,
      audio.masterOutput,
      audioBuffer,
      createCalibration({
        fadeIn: 1,
        fadeOut: 1,
        gain: 3,
        trimEnd: 0.75,
        trimStart: 0.25,
        tune: 12,
      }),
      20,
      0.5,
      2,
    )

    expect(source).toBe(audio.source)
    expect(audio.panNode.pan.value).toBe(1)
    expect(audio.panNode.connect).toHaveBeenCalledWith(audio.masterOutput)
    expect(audio.gainNode.connect).toHaveBeenCalledWith(audio.panNode)
    expect(audio.source.connect).toHaveBeenCalledWith(audio.gainNode)
    expect(audio.source.buffer).toBe(audioBuffer)
    expect(audio.source.playbackRate.value).toBe(2)
    expect(audio.source.loop).toBe(true)
    expect(audio.source.loopStart).toBe(2)
    expect(audio.source.loopEnd).toBe(6)
    expect(audio.source.start).toHaveBeenCalledWith(20, 2)
    expect(audio.source.stop).not.toHaveBeenCalled()
    expect(audio.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1.5, 20)
    expect(audio.gainNode.gain.linearRampToValueAtTime).not.toHaveBeenCalled()
  })

  it("disconnects the looping source and its output chain on end", () => {
    const audio = createAudioContext()

    scheduleLoopingSample(
      audio.context,
      audio.masterOutput,
      { duration: 4 } as AudioBuffer,
      createCalibration(),
      20,
    )
    audio.source.onended?.()

    expect(audio.source.disconnect).toHaveBeenCalledOnce()
    expect(audio.gainNode.disconnect).toHaveBeenCalledOnce()
    expect(audio.panNode.disconnect).toHaveBeenCalledOnce()
  })
})

describe("simple sample playback", () => {
  it("plays immediately through gain and pan and returns a stop callback", () => {
    const audio = createAudioContext()
    const audioBuffer = { duration: 4 } as AudioBuffer

    const stop = playSimpleSample(
      audio.context,
      audio.masterOutput,
      audioBuffer,
      3,
      2,
    )

    expect(audio.panNode.pan.value).toBe(1)
    expect(audio.panNode.connect).toHaveBeenCalledWith(audio.masterOutput)
    expect(audio.gainNode.gain.value).toBe(2)
    expect(audio.gainNode.connect).toHaveBeenCalledWith(audio.panNode)
    expect(audio.source.buffer).toBe(audioBuffer)
    expect(audio.source.connect).toHaveBeenCalledWith(audio.gainNode)
    expect(audio.source.start).toHaveBeenCalledWith()

    stop()
    expect(audio.source.stop).toHaveBeenCalledWith()
  })

  it("schedules directly through gain and returns a stop callback", () => {
    const audio = createAudioContext()
    const audioBuffer = { duration: 4 } as AudioBuffer

    const stop = scheduleSimpleSample(
      audio.context,
      audio.masterOutput,
      audioBuffer,
      20,
      1.25,
      3,
    )

    expect(audio.context.createStereoPanner).not.toHaveBeenCalled()
    expect(audio.gainNode.gain.value).toBe(2)
    expect(audio.gainNode.connect).toHaveBeenCalledWith(audio.masterOutput)
    expect(audio.source.buffer).toBe(audioBuffer)
    expect(audio.source.connect).toHaveBeenCalledWith(audio.gainNode)
    expect(audio.source.start).toHaveBeenCalledWith(20, 1.25)

    stop()
    expect(audio.source.stop).toHaveBeenCalledWith()
  })
})
