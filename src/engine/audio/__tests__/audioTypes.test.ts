import { expectTypeOf, it } from "vitest"
import type {
  ADSREnvelope as CanonicalADSREnvelope,
  AudioCalibration as CanonicalAudioCalibration,
  AudioFilter as CanonicalAudioFilter,
  AudioLfo as CanonicalAudioLfo,
  AudioWaveform as CanonicalAudioWaveform,
  FrequencySweep as CanonicalFrequencySweep,
  PlayFrequencyOptions as CanonicalPlayFrequencyOptions,
  PlayNoiseOptions as CanonicalPlayNoiseOptions,
  SamplePlayback as CanonicalSamplePlayback,
  VoiceId as CanonicalVoiceId,
} from "../audioTypes"
import type {
  ADSREnvelope,
  AudioCalibration,
  AudioFilter,
  AudioLfo,
  AudioWaveform,
  FrequencySweep,
  PlayFrequencyOptions,
  PlayNoiseOptions,
  SamplePlayback,
  VoiceId,
} from "../audioEngine"

it("keeps audioEngine type exports compatible with audioTypes", () => {
  expectTypeOf<ADSREnvelope>().toEqualTypeOf<CanonicalADSREnvelope>()
  expectTypeOf<AudioCalibration>().toEqualTypeOf<CanonicalAudioCalibration>()
  expectTypeOf<AudioFilter>().toEqualTypeOf<CanonicalAudioFilter>()
  expectTypeOf<AudioLfo>().toEqualTypeOf<CanonicalAudioLfo>()
  expectTypeOf<AudioWaveform>().toEqualTypeOf<CanonicalAudioWaveform>()
  expectTypeOf<FrequencySweep>().toEqualTypeOf<CanonicalFrequencySweep>()
  expectTypeOf<PlayFrequencyOptions>().toEqualTypeOf<CanonicalPlayFrequencyOptions>()
  expectTypeOf<PlayNoiseOptions>().toEqualTypeOf<CanonicalPlayNoiseOptions>()
  expectTypeOf<SamplePlayback>().toEqualTypeOf<CanonicalSamplePlayback>()
  expectTypeOf<VoiceId>().toEqualTypeOf<CanonicalVoiceId>()
})
