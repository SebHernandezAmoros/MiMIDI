import { decodeAudioData } from "../../engine/audio/audioEngine"
import { loadSampleBuffer } from "../../engine/audio/sampleStorage"

export async function loadSampleAudioBuffer(dbId: string): Promise<AudioBuffer | null> {
  const arrayBuffer = await loadSampleBuffer(dbId)
  if (!arrayBuffer) return null
  return decodeAudioData(arrayBuffer)
}
