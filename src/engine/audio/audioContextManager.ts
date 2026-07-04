export type AudioContextManagerDependencies = {
  createAudioContext(): AudioContext
}

export function createAudioContextManager(
  dependencies: AudioContextManagerDependencies,
) {
  let audioContext: AudioContext | null = null
  let resumePromise: Promise<void> | null = null

  function getAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = dependencies.createAudioContext()
    }

    if (audioContext.state === "suspended" && !resumePromise) {
      resumePromise = audioContext.resume().then(() => {
        resumePromise = null
      })
    }

    return audioContext
  }

  async function ensureAudioReady(): Promise<void> {
    const context = getAudioContext()

    if (context.state === "suspended") {
      try {
        const buffer = context.createBuffer(1, 1, context.sampleRate)
        const source = context.createBufferSource()
        source.buffer = buffer
        source.connect(context.destination)
        source.start(0)
      } catch {
        // Some browsers reject the silent unlock after the context is ready.
      }
    }

    if (resumePromise) await resumePromise
  }

  async function decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return getAudioContext().decodeAudioData(arrayBuffer.slice(0))
  }

  function getAudioContextCurrentTime(): number {
    return getAudioContext().currentTime
  }

  return {
    decodeAudioData,
    ensureAudioReady,
    getAudioContext,
    getAudioContextCurrentTime,
  }
}

const browserAudioContextManager = createAudioContextManager({
  createAudioContext: () => new AudioContext(),
})

export const decodeAudioData = browserAudioContextManager.decodeAudioData
export const ensureAudioReady = browserAudioContextManager.ensureAudioReady
export const getAudioContext = browserAudioContextManager.getAudioContext
export const getAudioContextCurrentTime =
  browserAudioContextManager.getAudioContextCurrentTime
