import type { AudioCalibration } from "./audioTypes"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function resolveSampleCalibration(
  totalDuration: number,
  calibration: AudioCalibration,
) {
  const offset =
    clamp(calibration.trimStart, 0, 1) * totalDuration
  const bufferDuration = Math.max(
    0.001,
    clamp(calibration.trimEnd, 0, 1) * totalDuration - offset,
  )
  const playbackRate = Math.pow(2, calibration.tune / 12)
  const realDuration = bufferDuration / playbackRate
  const fadeIn = clamp(
    calibration.fadeIn,
    0,
    realDuration * 0.9,
  )
  const fadeOut = clamp(
    calibration.fadeOut,
    0,
    realDuration * 0.9 - fadeIn,
  )

  return {
    bufferDuration,
    fadeIn,
    fadeOut,
    offset,
    playbackRate,
    realDuration,
  }
}
