export function createNoiseEngine(random = () => Math.random()) {
  let whiteNoiseBuffer: AudioBuffer | null = null

  function getWhiteNoiseBuffer(context: BaseAudioContext) {
    if (whiteNoiseBuffer) {
      return whiteNoiseBuffer
    }

    const bufferSize = context.sampleRate * 2
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let sampleIndex = 0; sampleIndex < bufferSize; sampleIndex += 1) {
      channelData[sampleIndex] = random() * 2 - 1
    }

    whiteNoiseBuffer = buffer

    return whiteNoiseBuffer
  }

  function createLoopingNoiseSource(context: BaseAudioContext) {
    const source = context.createBufferSource()

    source.buffer = getWhiteNoiseBuffer(context)
    source.loop = true

    return source
  }

  return {
    createLoopingNoiseSource,
    getWhiteNoiseBuffer,
  }
}

const noiseEngine = createNoiseEngine()

export const createLoopingNoiseSource =
  noiseEngine.createLoopingNoiseSource
