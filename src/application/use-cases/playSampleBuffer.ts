import type { AudioCalibration, SamplePlayback } from "../../engine/audio/audioTypes"
import { playAudioBufferCalibrated } from "../../engine/audio/audioEngine"

export type { SamplePlayback }

export function playSampleBuffer(
  buffer: AudioBuffer,
  calibration: AudioCalibration,
): SamplePlayback {
  return playAudioBufferCalibrated(buffer, calibration)
}
