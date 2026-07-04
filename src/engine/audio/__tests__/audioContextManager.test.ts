import { describe, expect, it, vi } from "vitest"
import { createAudioContextManager } from "../audioContextManager"

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })
  return { promise, resolve }
}

function createContext(options?: { resumePromise?: Promise<void> }) {
  const source = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
  }
  const context = {
    currentTime: 12.5,
    decodeAudioData: vi.fn(
      async (_input: ArrayBuffer) => ({ duration: 1 }) as AudioBuffer,
    ),
    destination: {},
    createBuffer: vi.fn(() => ({ silent: true })),
    createBufferSource: vi.fn(() => source),
    resume: vi.fn(() => options?.resumePromise ?? Promise.resolve()),
    sampleRate: 48000,
    state: "suspended",
  }

  return { context, source }
}

describe("audioContextManager", () => {
  it("creates one context lazily and shares an in-flight resume", () => {
    const deferred = createDeferred()
    const { context } = createContext({ resumePromise: deferred.promise })
    const createAudioContext = vi.fn(() => context as unknown as AudioContext)
    const manager = createAudioContextManager({ createAudioContext })

    expect(createAudioContext).not.toHaveBeenCalled()

    expect(manager.getAudioContext()).toBe(context)
    expect(manager.getAudioContext()).toBe(context)
    expect(createAudioContext).toHaveBeenCalledTimes(1)
    expect(context.resume).toHaveBeenCalledTimes(1)
  })

  it("performs the silent iOS unlock and waits for resume", async () => {
    const deferred = createDeferred()
    const { context, source } = createContext({ resumePromise: deferred.promise })
    const manager = createAudioContextManager({
      createAudioContext: () => context as unknown as AudioContext,
    })

    let ready = false
    const readyPromise = manager.ensureAudioReady().then(() => {
      ready = true
    })

    expect(context.createBuffer).toHaveBeenCalledWith(1, 1, 48000)
    expect(source.connect).toHaveBeenCalledWith(context.destination)
    expect(source.start).toHaveBeenCalledWith(0)
    expect(ready).toBe(false)

    deferred.resolve()
    await readyPromise
    expect(ready).toBe(true)
  })

  it("copies input data before decoding and exposes current time", async () => {
    const { context } = createContext()
    context.state = "running"
    const manager = createAudioContextManager({
      createAudioContext: () => context as unknown as AudioContext,
    })
    const input = new Uint8Array([1, 2, 3]).buffer

    await manager.decodeAudioData(input)

    const decodedInput = context.decodeAudioData.mock.calls[0][0]
    expect(decodedInput).not.toBe(input)
    expect(new Uint8Array(decodedInput)).toEqual(new Uint8Array(input))
    expect(manager.getAudioContextCurrentTime()).toBe(12.5)
  })
})
