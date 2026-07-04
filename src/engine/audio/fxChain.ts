import type { PlayFrequencyOptions } from "./audioTypes"

type VoiceFxOptions = Pick<
  PlayFrequencyOptions,
  "distortion" | "filter"
>

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256
  const curve = new Float32Array(samples)
  const k = clamp(amount, 0, 1) * 120

  for (let index = 0; index < samples; index += 1) {
    const input = (index * 2) / samples - 1
    curve[index] =
      ((Math.PI + k) * input) / (Math.PI + k * Math.abs(input))
  }

  return curve
}

export function createVoiceFxChain(
  context: BaseAudioContext,
  input: AudioNode,
  options: VoiceFxOptions,
): AudioNode {
  let tail = input

  if (options.distortion && options.distortion > 0) {
    const shaper = context.createWaveShaper()
    shaper.curve = makeDistortionCurve(
      options.distortion,
    ) as Float32Array<ArrayBuffer>
    shaper.oversample = "2x"
    tail.connect(shaper)
    tail = shaper
  }

  if (options.filter) {
    const filter = context.createBiquadFilter()
    filter.type = options.filter.type
    filter.frequency.setValueAtTime(
      options.filter.frequency,
      context.currentTime,
    )
    if (options.filter.Q !== undefined) {
      filter.Q.setValueAtTime(options.filter.Q, context.currentTime)
    }
    tail.connect(filter)
    tail = filter
  }

  return tail
}
