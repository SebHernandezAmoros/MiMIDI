import type { PlayFrequencyOptions } from "./audioTypes"

type VoiceOscillatorOptions = Pick<
  PlayFrequencyOptions,
  "sweep" | "waveform"
>

export function createVoiceOscillator(
  context: BaseAudioContext,
  frequency: number,
  options: VoiceOscillatorOptions = {},
) {
  const oscillator = context.createOscillator()

  oscillator.type = options.waveform ?? "sine"

  if (options.sweep) {
    oscillator.frequency.setValueAtTime(
      options.sweep.from,
      context.currentTime,
    )
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(options.sweep.to, 1),
      context.currentTime + options.sweep.duration,
    )
  } else {
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
  }

  return oscillator
}
