import { findAvailableMathematicalInstrument } from "./instrumentCatalog"
import type {
  ADSREnvelope,
  AudioCalibration,
  AudioLfo,
  AudioWaveform,
} from "./audioTypes"
import {
  type MathematicalInstrument,
} from "./mathematicalInstruments"
import type { MidiRecordedNote } from "../midi/events"
import { noteToFrequency } from "../midi/notes"
import {
  getMidiTracks,
  getSamplerTracks,
  getSamplerTrackDuration,
  getTrackVolumeAutomationValue,
  getScheduledTrackNotes,
  isTrackAudible,
  type MusicalProject,
} from "../project/projectModel"
import { loadSlotMetas } from "./sampleModel"
import { loadSampleBuffer } from "./sampleStorage"

export type OfflineRenderOptions = {
  masterVolume?: number
  sampleRate?: number
}

type ScheduledPlaybackEvent = {
  duration: number
  envelope: ADSREnvelope
  instrument: MathematicalInstrument
  note: MidiRecordedNote
  pan: number
  startTime: number
  volume: number
}

const DEFAULT_SAMPLE_RATE = 48_000
const DEFAULT_RELEASE_MARGIN = 0.35

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function resolveEnvelope(
  instrumentEnvelope: ADSREnvelope,
  overrides?: Partial<ADSREnvelope>,
): ADSREnvelope {
  return {
    ...instrumentEnvelope,
    ...overrides,
  }
}

function getWhiteNoiseBuffer(ctx: OfflineAudioContext) {
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let sampleIndex = 0; sampleIndex < bufferSize; sampleIndex += 1) {
    channelData[sampleIndex] = Math.random() * 2 - 1
  }

  return buffer
}

function createMasterGain(
  ctx: OfflineAudioContext,
  masterVolume: number,
) {
  const masterGainNode = ctx.createGain()

  masterGainNode.gain.setValueAtTime(clamp(masterVolume, 0, 1), 0)
  masterGainNode.connect(ctx.destination)

  return masterGainNode
}

function scheduleEnvelope(
  gainNode: GainNode,
  startTime: number,
  duration: number,
  volume: number,
  envelope: ADSREnvelope,
) {
  const peakVolume = clamp(volume, 0, 1)
  const sustainVolume = peakVolume * clamp(envelope.sustain, 0, 1)
  const attackEnd = startTime + envelope.attack
  const decayEnd = attackEnd + envelope.decay
  const releaseStart = startTime + duration
  const releaseEnd = releaseStart + envelope.release

  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.linearRampToValueAtTime(peakVolume, attackEnd)
  gainNode.gain.linearRampToValueAtTime(sustainVolume, decayEnd)
  gainNode.gain.cancelScheduledValues(releaseStart)
  gainNode.gain.setValueAtTime(sustainVolume, releaseStart)
  gainNode.gain.linearRampToValueAtTime(0.0001, releaseEnd)

  return releaseEnd
}

function scheduleLfo(
  ctx: OfflineAudioContext,
  source: OscillatorNode,
  gainNode: GainNode,
  lfo: AudioLfo | undefined,
  startTime: number,
  stopTime: number,
) {
  if (!lfo) {
    return
  }

  const lfoSource = ctx.createOscillator()
  const lfoGainNode = ctx.createGain()

  lfoSource.type = lfo.waveform ?? "sine"
  lfoSource.frequency.setValueAtTime(Math.max(lfo.rate, 0.01), startTime)
  lfoGainNode.gain.setValueAtTime(Math.max(lfo.depth, 0), startTime)

  lfoSource.connect(lfoGainNode)

  if (lfo.target === "gain") {
    lfoGainNode.connect(gainNode.gain)
  } else {
    lfoGainNode.connect(source.frequency)
  }

  lfoSource.start(startTime)
  lfoSource.stop(stopTime)
}

function createScheduledPlaybackEvents(project: MusicalProject) {
  return getScheduledTrackNotes(project).flatMap((scheduledNote) => {
    const { note, relativeStartTime, track } = scheduledNote

    if (!isTrackAudible(track, getMidiTracks(project.timeline))) {
      return []
    }

    const instrument = findAvailableMathematicalInstrument(
      note.instrumentId,
      project.pluginStates,
    )
    const envelope = resolveEnvelope(instrument.envelope, note.playbackEnvelope)
    const automationVolume = getTrackVolumeAutomationValue(
      track.volumeAutomation,
      relativeStartTime,
    )
    const playbackVolume = clamp(
      (note.playbackVolume ?? track.volume) * automationVolume,
      0,
      1.5,
    )

    return {
      duration: note.duration,
      envelope,
      instrument,
      note,
      pan: track.pan,
      startTime: scheduledNote.absoluteStartTime,
      volume: playbackVolume,
    } satisfies ScheduledPlaybackEvent
  })
}

export function getProjectRenderDuration(project: MusicalProject) {
  const scheduledEvents = createScheduledPlaybackEvents(project)

  const midiEnd = scheduledEvents.reduce((maxEndTime, scheduledEvent) => {
    const eventEnd =
      scheduledEvent.startTime +
      scheduledEvent.duration +
      scheduledEvent.envelope.release +
      DEFAULT_RELEASE_MARGIN
    return Math.max(maxEndTime, eventEnd)
  }, 0)

  const samplerEnd = getSamplerTracks(project.timeline)
    .filter((t) => !t.muted)
    .reduce((max, track) => {
      const trackDur = getSamplerTrackDuration(track)
      return track.clips.reduce((m, c) => Math.max(m, c.startTime + trackDur), max)
    }, 0)

  return Math.max(0.5, midiEnd, samplerEnd)
}

function scheduleOfflineFrequencyEvent(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  scheduledEvent: ScheduledPlaybackEvent,
) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const stopTime = scheduleEnvelope(
    gainNode,
    scheduledEvent.startTime,
    scheduledEvent.duration,
    scheduledEvent.instrument.volume * scheduledEvent.volume,
    scheduledEvent.envelope,
  )

  oscillator.type = scheduledEvent.instrument.waveform
  oscillator.frequency.setValueAtTime(
    noteToFrequency(scheduledEvent.note.note),
    scheduledEvent.startTime,
  )
  panNode.pan.setValueAtTime(clamp(scheduledEvent.pan, -1, 1), scheduledEvent.startTime)

  oscillator.connect(gainNode)
  gainNode.connect(panNode)
  panNode.connect(destination)

  scheduleLfo(
    ctx,
    oscillator,
    gainNode,
    scheduledEvent.instrument.lfo,
    scheduledEvent.startTime,
    stopTime,
  )

  oscillator.start(scheduledEvent.startTime)
  oscillator.stop(stopTime)
}

function scheduleOfflineNoiseBurst(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  options: {
    duration: number
    envelope: ADSREnvelope
    filter?: { type: BiquadFilterType; frequency: number; Q?: number }
    pan: number
    startTime: number
    volume: number
  },
) {
  const source = ctx.createBufferSource()
  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const stopTime = scheduleEnvelope(
    gainNode,
    options.startTime,
    options.duration,
    options.volume,
    options.envelope,
  )

  source.buffer = getWhiteNoiseBuffer(ctx)
  source.loop = true
  panNode.pan.setValueAtTime(clamp(options.pan, -1, 1), options.startTime)

  source.connect(gainNode)
  if (options.filter) {
    const filterNode = ctx.createBiquadFilter()
    filterNode.type = options.filter.type
    filterNode.frequency.value = options.filter.frequency
    filterNode.Q.value = options.filter.Q ?? 1
    gainNode.connect(filterNode)
    filterNode.connect(panNode)
  } else {
    gainNode.connect(panNode)
  }
  panNode.connect(destination)

  source.start(options.startTime)
  source.stop(stopTime)
}

function scheduleOfflineFrequencyBurst(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  options: {
    duration: number
    envelope: ADSREnvelope
    frequency: number
    pan: number
    startTime: number
    sweep?: { from: number; duration: number }
    volume: number
    waveform: AudioWaveform
  },
) {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const stopTime = scheduleEnvelope(
    gainNode,
    options.startTime,
    options.duration,
    options.volume,
    options.envelope,
  )

  oscillator.type = options.waveform
  if (options.sweep) {
    oscillator.frequency.setValueAtTime(Math.max(0.001, options.sweep.from), options.startTime)
    oscillator.frequency.linearRampToValueAtTime(options.frequency, options.startTime + options.sweep.duration)
  } else {
    oscillator.frequency.setValueAtTime(options.frequency, options.startTime)
  }
  panNode.pan.setValueAtTime(clamp(options.pan, -1, 1), options.startTime)

  oscillator.connect(gainNode)
  gainNode.connect(panNode)
  panNode.connect(destination)

  oscillator.start(options.startTime)
  oscillator.stop(stopTime)
}

function scheduleOfflineSmcPadEvent(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  scheduledEvent: ScheduledPlaybackEvent,
) {
  const soundId = scheduledEvent.note.smcPadSoundId

  if (!soundId) {
    return
  }

  const scaledVolume = scheduledEvent.volume

  const p = scheduledEvent.pan
  const t = scheduledEvent.startTime
  const v = scaledVolume

  switch (soundId) {
    case "kick":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.18,
        envelope: { attack: 0.0001, decay: 0.08, sustain: 0.01, release: 0.09 },
        frequency: 42,
        pan: p, startTime: t,
        sweep: { from: 200, duration: 0.055 },
        volume: 0.88 * v,
        waveform: "sine",
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.06,
        envelope: { attack: 0.0001, decay: 0.04, sustain: 0, release: 0.03 },
        frequency: 63,
        pan: p, startTime: t,
        sweep: { from: 160, duration: 0.04 },
        volume: 0.32 * v,
        waveform: "triangle",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.007,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.003 },
        filter: { type: "bandpass", frequency: 1400, Q: 0.6 },
        pan: p, startTime: t,
        volume: 0.45 * v,
      })
      return

    case "snare":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.065,
        envelope: { attack: 0.0001, decay: 0.03, sustain: 0.01, release: 0.04 },
        filter: { type: "highpass", frequency: 4200, Q: 0.5 },
        pan: p, startTime: t,
        volume: 0.52 * v,
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.1,
        envelope: { attack: 0.0001, decay: 0.042, sustain: 0.04, release: 0.07 },
        filter: { type: "bandpass", frequency: 260, Q: 0.7 },
        pan: p, startTime: t,
        volume: 0.32 * v,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.06,
        envelope: { attack: 0.0001, decay: 0.026, sustain: 0.01, release: 0.04 },
        frequency: 180,
        pan: p, startTime: t,
        sweep: { from: 230, duration: 0.04 },
        volume: 0.22 * v,
        waveform: "triangle",
      })
      return

    case "hat":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.045,
        envelope: { attack: 0.0001, decay: 0.018, sustain: 0.01, release: 0.028 },
        filter: { type: "highpass", frequency: 7000, Q: 0.7 },
        pan: p, startTime: t,
        volume: 0.44 * v,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.025,
        envelope: { attack: 0.0001, decay: 0.01, sustain: 0.008, release: 0.018 },
        frequency: 8372,
        pan: p, startTime: t,
        volume: 0.1 * v,
        waveform: "square",
      })
      return

    case "clap":
      ;[0, 0.018, 0.038].forEach((delaySeconds, burstIndex) => {
        scheduleOfflineNoiseBurst(ctx, destination, {
          duration: 0.038,
          envelope: { attack: 0.001, decay: 0.011, sustain: 0.02, release: 0.026 },
          filter: { type: "bandpass", frequency: 1800, Q: 0.65 },
          pan: p,
          startTime: t + delaySeconds,
          volume: (burstIndex === 0 ? 0.42 : 0.26) * v,
        })
        scheduleOfflineNoiseBurst(ctx, destination, {
          duration: 0.028,
          envelope: { attack: 0.0001, decay: 0.011, sustain: 0.008, release: 0.02 },
          filter: { type: "highpass", frequency: 4200, Q: 0.5 },
          pan: p,
          startTime: t + delaySeconds,
          volume: (burstIndex === 0 ? 0.48 : 0.3) * v,
        })
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.22,
        envelope: { attack: 0.008, decay: 0.08, sustain: 0.025, release: 0.14 },
        filter: { type: "bandpass", frequency: 2400, Q: 0.5 },
        pan: p, startTime: t,
        volume: 0.16 * v,
      })
      return

    case "tom":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.22,
        envelope: { attack: 0.0001, decay: 0.1, sustain: 0.03, release: 0.1 },
        frequency: 100,
        pan: p, startTime: t,
        sweep: { from: 360, duration: 0.09 },
        volume: 0.78 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.009,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 900, Q: 0.7 },
        pan: p, startTime: t,
        volume: 0.38 * v,
      })
      return

    case "cowbell":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.3,
        envelope: { attack: 0.0001, decay: 0.09, sustain: 0.07, release: 0.22 },
        frequency: 562,
        pan: p, startTime: t,
        volume: 0.34 * v,
        waveform: "square",
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.28,
        envelope: { attack: 0.0001, decay: 0.08, sustain: 0.05, release: 0.18 },
        frequency: 845,
        pan: p, startTime: t,
        volume: 0.26 * v,
        waveform: "square",
      })
      return

    case "rimshot":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.038,
        envelope: { attack: 0.0001, decay: 0.022, sustain: 0.008, release: 0.018 },
        filter: { type: "bandpass", frequency: 2200, Q: 0.75 },
        pan: p, startTime: t,
        volume: 0.7 * v,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.055,
        envelope: { attack: 0.0001, decay: 0.022, sustain: 0.01, release: 0.035 },
        frequency: 920,
        pan: p, startTime: t,
        sweep: { from: 1200, duration: 0.03 },
        volume: 0.48 * v,
        waveform: "triangle",
      })
      return

    case "shaker":
      ;[0, 0.045].forEach((offset) => {
        scheduleOfflineNoiseBurst(ctx, destination, {
          duration: 0.06,
          envelope: { attack: 0.0005, decay: 0.028, sustain: 0.012, release: 0.032 },
          filter: { type: "bandpass", frequency: 5000, Q: 0.8 },
          pan: p,
          startTime: t + offset,
          volume: 0.48 * v,
        })
        scheduleOfflineNoiseBurst(ctx, destination, {
          duration: 0.022,
          envelope: { attack: 0.0001, decay: 0.01, sustain: 0.006, release: 0.014 },
          filter: { type: "highpass", frequency: 7500, Q: 0.6 },
          pan: p,
          startTime: t + offset,
          volume: 0.3 * v,
        })
      })
      return

    case "open-hat":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.9,
        envelope: { attack: 0.0001, decay: 0.21, sustain: 0.02, release: 0.45 },
        filter: { type: "highpass", frequency: 7000, Q: 0.7 },
        pan: p, startTime: t,
        volume: 0.42 * v,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.75,
        envelope: { attack: 0.0001, decay: 0.15, sustain: 0.015, release: 0.36 },
        frequency: 8372,
        pan: p, startTime: t,
        volume: 0.1 * v,
        waveform: "square",
      })
      return

    case "crash":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 1.4,
        envelope: { attack: 0.001, decay: 0.55, sustain: 0.04, release: 1.0 },
        filter: { type: "highpass", frequency: 4500, Q: 0.4 },
        pan: p, startTime: t,
        volume: 0.2 * v,
      })
      ;[6000, 8500, 11200].forEach((freq, i) => {
        scheduleOfflineFrequencyBurst(ctx, destination, {
          duration: 0.9,
          envelope: { attack: 0.001, decay: 0.35, sustain: 0.015, release: 0.7 },
          frequency: freq,
          pan: p, startTime: t,
          volume: (0.038 - i * 0.006) * v,
          waveform: "square",
        })
      })
      return

    case "ride":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.45,
        envelope: { attack: 0.0001, decay: 0.2, sustain: 0.07, release: 0.35 },
        frequency: 2500,
        pan: p, startTime: t,
        sweep: { from: 2700, duration: 0.05 },
        volume: 0.44 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.3,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0.02, release: 0.22 },
        filter: { type: "highpass", frequency: 7500, Q: 0.5 },
        pan: p, startTime: t,
        volume: 0.12 * v,
      })
      return

    case "floor-tom":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.28,
        envelope: { attack: 0.0001, decay: 0.14, sustain: 0.03, release: 0.14 },
        frequency: 65,
        pan: p, startTime: t,
        sweep: { from: 290, duration: 0.11 },
        volume: 0.82 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.009,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 700, Q: 0.8 },
        pan: p, startTime: t,
        volume: 0.36 * v,
      })
      return

    case "hi-tom":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.15,
        envelope: { attack: 0.0001, decay: 0.075, sustain: 0.02, release: 0.07 },
        frequency: 180,
        pan: p, startTime: t,
        sweep: { from: 576, duration: 0.07 },
        volume: 0.72 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.007,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.003 },
        filter: { type: "bandpass", frequency: 1200, Q: 0.7 },
        pan: p, startTime: t,
        volume: 0.32 * v,
      })
      return

    case "conga":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.18,
        envelope: { attack: 0.0001, decay: 0.08, sustain: 0.02, release: 0.08 },
        frequency: 320,
        pan: p, startTime: t,
        sweep: { from: 576, duration: 0.06 },
        volume: 0.72 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.012,
        envelope: { attack: 0.0001, decay: 0.007, sustain: 0, release: 0.005 },
        filter: { type: "bandpass", frequency: 1000, Q: 0.8 },
        pan: p, startTime: t,
        volume: 0.3 * v,
      })
      return

    case "woodblock":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.06,
        envelope: { attack: 0.0001, decay: 0.024, sustain: 0.02, release: 0.04 },
        frequency: 800,
        pan: p, startTime: t,
        volume: 0.52 * v,
        waveform: "triangle",
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.045,
        envelope: { attack: 0.0001, decay: 0.018, sustain: 0.015, release: 0.032 },
        frequency: 1180,
        pan: p, startTime: t,
        volume: 0.38 * v,
        waveform: "triangle",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.008,
        envelope: { attack: 0.0001, decay: 0.004, sustain: 0, release: 0.004 },
        filter: { type: "bandpass", frequency: 1500, Q: 1.5 },
        pan: p, startTime: t,
        volume: 0.24 * v,
      })
      return

    case "sub":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.6,
        envelope: { attack: 0.0001, decay: 0.26, sustain: 0.02, release: 0.22 },
        frequency: 35,
        pan: p, startTime: t,
        sweep: { from: 105, duration: 0.08 },
        volume: 0.9 * v,
        waveform: "sine",
      })
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.01,
        envelope: { attack: 0.0001, decay: 0.005, sustain: 0, release: 0.005 },
        filter: { type: "bandpass", frequency: 1200, Q: 0.8 },
        pan: p, startTime: t,
        volume: 0.3 * v,
      })
      return
  }
}

function scheduleOfflineSamplerSample(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  audioBuffer: AudioBuffer,
  cal: AudioCalibration,
  when: number,
) {
  if (when < 0) return
  const totalDur = audioBuffer.duration
  const offset = clamp(cal.trimStart, 0, 1) * totalDur
  const bufferDuration = Math.max(0.001, clamp(cal.trimEnd, 0, 1) * totalDur - offset)
  const playbackRate = Math.pow(2, cal.tune / 12)
  const realDuration = bufferDuration / playbackRate
  const endTime = when + realDuration

  const gainNode = ctx.createGain()
  const panNode = ctx.createStereoPanner()
  const baseGain = clamp(cal.gain, 0, 4)
  const fadeIn = clamp(cal.fadeIn, 0, realDuration * 0.9)
  const fadeOut = clamp(cal.fadeOut, 0, realDuration * 0.9 - fadeIn)

  if (fadeIn > 0) {
    gainNode.gain.setValueAtTime(0.0001, when)
    gainNode.gain.linearRampToValueAtTime(baseGain, when + fadeIn)
  } else {
    gainNode.gain.setValueAtTime(baseGain, when)
  }
  if (fadeOut > 0) {
    gainNode.gain.setValueAtTime(baseGain, endTime - fadeOut)
    gainNode.gain.linearRampToValueAtTime(0.0001, endTime)
  }

  gainNode.connect(panNode)
  panNode.connect(destination)

  const source = ctx.createBufferSource()
  source.buffer = audioBuffer
  source.playbackRate.value = playbackRate
  source.connect(gainNode)
  source.start(when, offset)
  source.stop(endTime)
}

async function scheduleSamplerMixesOffline(
  ctx: OfflineAudioContext,
  destination: AudioNode,
  project: MusicalProject,
) {
  const slots = loadSlotMetas()
  const bufferCache = new Map<string, AudioBuffer | null>()

  for (const track of getSamplerTracks(project.timeline)) {
    if (track.muted) continue
    const secondsPerStep = 60 / track.pattern.bpm / 4

    for (const clip of track.clips) {
      for (const lane of track.pattern.lanes) {
        const slot = slots.find((s) => s?.dbId === lane.slotDbId)
        if (!slot) continue

        if (!bufferCache.has(lane.slotDbId)) {
          const arrayBuffer = await loadSampleBuffer(lane.slotDbId)
          if (!arrayBuffer) {
            bufferCache.set(lane.slotDbId, null)
            continue
          }
          try {
            const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0))
            bufferCache.set(lane.slotDbId, decoded)
          } catch {
            bufferCache.set(lane.slotDbId, null)
          }
        }

        const audioBuf = bufferCache.get(lane.slotDbId)
        if (!audioBuf) continue

        for (let i = 0; i < lane.steps.length; i++) {
          if (!lane.steps[i].active) continue
          const when = clip.startTime + i * secondsPerStep
          scheduleOfflineSamplerSample(ctx, destination, audioBuf, slot.calibration, when)
        }
      }
    }
  }
}

export async function renderProjectOffline(
  project: MusicalProject,
  options: OfflineRenderOptions = {},
) {
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE
  const renderDuration = getProjectRenderDuration(project)
  const offlineAudioContext = new OfflineAudioContext(
    2,
    Math.ceil(renderDuration * sampleRate),
    sampleRate,
  )
  const masterGainNode = createMasterGain(
    offlineAudioContext,
    options.masterVolume ?? 0.8,
  )
  const scheduledEvents = createScheduledPlaybackEvents(project)

  for (const scheduledEvent of scheduledEvents) {
    if (
      scheduledEvent.note.playbackSource === "smc-pad" &&
      scheduledEvent.note.smcPadSoundId
    ) {
      scheduleOfflineSmcPadEvent(
        offlineAudioContext,
        masterGainNode,
        scheduledEvent,
      )
      continue
    }

    scheduleOfflineFrequencyEvent(
      offlineAudioContext,
      masterGainNode,
      scheduledEvent,
    )
  }

  await scheduleSamplerMixesOffline(offlineAudioContext, masterGainNode, project)

  return offlineAudioContext.startRendering()
}
