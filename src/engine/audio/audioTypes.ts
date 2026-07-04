export type AudioWaveform = OscillatorType

export type ADSREnvelope = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type AudioLfo = {
  depth: number
  rate: number
  target?: "frequency" | "gain"
  waveform?: OscillatorType
}

export type FrequencySweep = {
  from: number
  to: number
  duration: number
}

export type AudioFilter = {
  type: BiquadFilterType
  frequency: number
  Q?: number
}

export type PlayFrequencyOptions = {
  duration?: number
  pan?: number
  volume?: number
  waveform?: AudioWaveform
  envelope?: Partial<ADSREnvelope>
  lfo?: AudioLfo
  sweep?: FrequencySweep
  filter?: AudioFilter
  distortion?: number
}

export type PlayNoiseOptions = Omit<PlayFrequencyOptions, "waveform">

export type VoiceId = string

export type AudioCalibration = {
  trimStart: number
  trimEnd: number
  gain: number
  fadeIn: number
  fadeOut: number
  tune: number
}

export type SamplePlayback = {
  stop: () => void
  setGain: (linearGain: number) => void
  setTune: (semitones: number) => void
  realDurationMs: number
}
