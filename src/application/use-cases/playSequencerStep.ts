import { playAudioBufferCalibratedAt, type AudioCalibration } from "../../engine/audio/audioEngine"

export function playSequencerStep(
  buf: AudioBuffer,
  calibration: AudioCalibration,
  when: number,
): void {
  playAudioBufferCalibratedAt(buf, calibration, when)
}
