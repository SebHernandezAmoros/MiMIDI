import { playAudioBufferCalibrated, type AudioCalibration, type SamplePlayback } from "../../engine/audio/audioEngine"

export type { SamplePlayback }

export function playSampleBuffer(
  buffer: AudioBuffer,
  calibration: AudioCalibration,
): SamplePlayback {
  return playAudioBufferCalibrated(buffer, calibration)
}
