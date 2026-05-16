import { decodeAudioData } from "../../engine/audio/audioEngine"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"

export type ImportedSampleData = {
  audioBuffer: AudioBuffer
  dbId: string
  name: string
  duration: number
  sampleRate: number
  channels: number
}

export async function importSampleFile(file: File): Promise<ImportedSampleData> {
  const arrayBuffer = await file.arrayBuffer()
  const audioBuffer = await decodeAudioData(arrayBuffer)
  const dbId = `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await saveSampleBuffer(dbId, arrayBuffer)

  return {
    audioBuffer,
    dbId,
    name: file.name.replace(/\.[^.]+$/, ""),
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  }
}
