import type { AudioLfo } from "./audioTypes"

export function createVoiceLfo(
  context: BaseAudioContext,
  target: AudioParam,
  lfo: AudioLfo,
) {
  const lfoSource = context.createOscillator()
  const lfoGainNode = context.createGain()

  lfoSource.type = lfo.waveform ?? "sine"
  lfoSource.frequency.setValueAtTime(
    Math.max(lfo.rate, 0.01),
    context.currentTime,
  )
  lfoGainNode.gain.setValueAtTime(
    Math.max(lfo.depth, 0),
    context.currentTime,
  )

  lfoSource.connect(lfoGainNode)
  lfoGainNode.connect(target)
  lfoSource.start()

  return {
    gainNode: lfoGainNode,
    source: lfoSource,
  }
}
