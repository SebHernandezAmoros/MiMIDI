export type WavBitDepth = 16 | 24 | 32

export type WavEncodingOptions = {
  bitDepth?: WavBitDepth
  float?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let characterIndex = 0; characterIndex < value.length; characterIndex += 1) {
    view.setUint8(offset + characterIndex, value.charCodeAt(characterIndex))
  }
}

function writePcm24(view: DataView, offset: number, value: number) {
  const clampedValue = clamp(value, -1, 1)
  const sample = Math.round(clampedValue * 8_388_607)

  view.setUint8(offset, sample & 0xff)
  view.setUint8(offset + 1, (sample >> 8) & 0xff)
  view.setUint8(offset + 2, (sample >> 16) & 0xff)
}

export function encodeAudioBufferToWav(
  audioBuffer: AudioBuffer,
  options: WavEncodingOptions = {},
) {
  const bitDepth = options.bitDepth ?? 32
  const useFloatEncoding = options.float ?? bitDepth === 32
  const bytesPerSample = bitDepth / 8
  const frameCount = audioBuffer.length
  const channelCount = audioBuffer.numberOfChannels
  const dataByteLength = frameCount * channelCount * bytesPerSample
  const wavArrayBuffer = new ArrayBuffer(44 + dataByteLength)
  const view = new DataView(wavArrayBuffer)
  const audioFormat = useFloatEncoding ? 3 : 1
  const blockAlign = channelCount * bytesPerSample
  const byteRate = audioBuffer.sampleRate * blockAlign

  writeAscii(view, 0, "RIFF")
  view.setUint32(4, 36 + dataByteLength, true)
  writeAscii(view, 8, "WAVE")
  writeAscii(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, audioFormat, true)
  view.setUint16(22, channelCount, true)
  view.setUint32(24, audioBuffer.sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeAscii(view, 36, "data")
  view.setUint32(40, dataByteLength, true)

  let dataOffset = 44

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = audioBuffer.getChannelData(channelIndex)[frameIndex]

      if (useFloatEncoding) {
        view.setFloat32(dataOffset, sample, true)
      } else if (bitDepth === 24) {
        writePcm24(view, dataOffset, sample)
      } else {
        view.setInt16(
          dataOffset,
          Math.round(clamp(sample, -1, 1) * 32_767),
          true,
        )
      }

      dataOffset += bytesPerSample
    }
  }

  return wavArrayBuffer
}
