import { findAvailableMathematicalInstrument } from "./instrumentCatalog"
import type {
  ADSREnvelope,
  AudioLfo,
  AudioWaveform,
} from "./audioEngine"
import {
  type MathematicalInstrument,
} from "./mathematicalInstruments"
import type { MidiRecordedNote } from "../midi/events"
import { noteToFrequency } from "../midi/notes"
import {
  getMidiTracks,
  getTrackVolumeAutomationValue,
  getScheduledTrackNotes,
  isTrackAudible,
  type MusicalProject,
} from "../project/projectModel"

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

  if (scheduledEvents.length === 0) {
    return 0.5
  }

  return scheduledEvents.reduce((maxEndTime, scheduledEvent) => {
    const eventEnd =
      scheduledEvent.startTime +
      scheduledEvent.duration +
      scheduledEvent.envelope.release +
      DEFAULT_RELEASE_MARGIN

    return Math.max(maxEndTime, eventEnd)
  }, 0.5)
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
  gainNode.connect(panNode)
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
  oscillator.frequency.setValueAtTime(options.frequency, options.startTime)
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

  switch (soundId) {
    case "kick":
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.14,
        envelope: {
          attack: 0.001,
          decay: 0.045,
          sustain: 0.04,
          release: 0.05,
        },
        frequency: 64,
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.64 * scaledVolume,
        waveform: "sine",
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.24,
        envelope: {
          attack: 0.001,
          decay: 0.07,
          sustain: 0.04,
          release: 0.1,
        },
        frequency: 49,
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.24 * scaledVolume,
        waveform: "triangle",
      })
      return

    case "snare":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.11,
        envelope: {
          attack: 0.001,
          decay: 0.032,
          sustain: 0.07,
          release: 0.06,
        },
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.28 * scaledVolume,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.09,
        envelope: {
          attack: 0.001,
          decay: 0.02,
          sustain: 0.03,
          release: 0.05,
        },
        frequency: 178,
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.08 * scaledVolume,
        waveform: "sawtooth",
      })
      return

    case "hat":
      scheduleOfflineNoiseBurst(ctx, destination, {
        duration: 0.04,
        envelope: {
          attack: 0.001,
          decay: 0.009,
          sustain: 0.015,
          release: 0.02,
        },
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.13 * scaledVolume,
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.025,
        envelope: {
          attack: 0.001,
          decay: 0.005,
          sustain: 0.01,
          release: 0.01,
        },
        frequency: 8400,
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.015 * scaledVolume,
        waveform: "square",
      })
      return

    case "clap":
      ;[0, 0.018, 0.038].forEach((delaySeconds, burstIndex) => {
        scheduleOfflineNoiseBurst(ctx, destination, {
          duration: 0.038,
          envelope: {
            attack: 0.001,
            decay: 0.011,
            sustain: 0.02,
            release: 0.026,
          },
          pan: scheduledEvent.pan,
          startTime: scheduledEvent.startTime + delaySeconds,
          volume: (burstIndex === 0 ? 0.2 : 0.14) * scaledVolume,
        })
      })
      scheduleOfflineFrequencyBurst(ctx, destination, {
        duration: 0.05,
        envelope: {
          attack: 0.001,
          decay: 0.01,
          sustain: 0.01,
          release: 0.02,
        },
        frequency: 520,
        pan: scheduledEvent.pan,
        startTime: scheduledEvent.startTime,
        volume: 0.03 * scaledVolume,
        waveform: "triangle",
      })
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

  return offlineAudioContext.startRendering()
}
