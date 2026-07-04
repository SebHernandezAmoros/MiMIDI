import type { AudioCalibration } from "../../engine/audio/audioTypes"
import { playAudioBufferCalibratedAt } from "../../engine/audio/audioEngine"

export function playSequencerStep(
  buf: AudioBuffer,
  calibration: AudioCalibration,
  when: number,
): void {
  playAudioBufferCalibratedAt(buf, calibration, when)
}
