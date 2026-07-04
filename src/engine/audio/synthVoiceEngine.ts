import type { ADSREnvelope, VoiceId } from "./audioTypes"

type VoiceSource = OscillatorNode | AudioBufferSourceNode

type ActiveVoice = {
  source: VoiceSource
  gainNode: GainNode
  envelope: ADSREnvelope
  lfoGainNode?: GainNode
  lfoSource?: OscillatorNode
  panNode: StereoPannerNode
  sustainVolume: number
}

type RegisterActiveVoiceInput = ActiveVoice & {
  lfoNodes?: {
    gainNode: GainNode
    source: OscillatorNode
  }
  voiceId: VoiceId
}

const DEFAULT_ENVELOPE: ADSREnvelope = {
  attack: 0.01,
  decay: 0.12,
  sustain: 0.72,
  release: 0.18,
}

export function createSynthVoiceEngine() {
  let voiceCounter = 0
  const activeVoices = new Map<VoiceId, ActiveVoice>()

  function createVoiceId(): VoiceId {
    return `voice-${voiceCounter++}`
  }

  function scheduleVoiceStart(
    gainNode: GainNode,
    volume: number,
    envelopeOverrides: Partial<ADSREnvelope> | undefined,
    startTime: number,
  ) {
    const envelope = {
      ...DEFAULT_ENVELOPE,
      ...envelopeOverrides,
    }
    const attackEnd = startTime + envelope.attack
    const decayEnd = attackEnd + envelope.decay
    const sustainVolume = volume * envelope.sustain

    gainNode.gain.cancelScheduledValues(startTime)
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, attackEnd)
    gainNode.gain.linearRampToValueAtTime(sustainVolume, decayEnd)

    return {
      envelope,
      sustainVolume,
    }
  }

  function scheduleVoiceStop(voiceId: VoiceId, releaseStartTime: number) {
    const voice = activeVoices.get(voiceId)

    if (!voice) {
      return
    }

    const releaseEndTime = releaseStartTime + voice.envelope.release

    voice.gainNode.gain.cancelScheduledValues(releaseStartTime)
    voice.gainNode.gain.setValueAtTime(
      voice.sustainVolume,
      releaseStartTime,
    )
    voice.gainNode.gain.linearRampToValueAtTime(0.0001, releaseEndTime)
    voice.source.stop(releaseEndTime)
    voice.lfoSource?.stop(releaseEndTime)
  }

  function registerActiveVoice({
    envelope,
    gainNode,
    lfoNodes,
    panNode,
    source,
    sustainVolume,
    voiceId,
  }: RegisterActiveVoiceInput) {
    activeVoices.set(voiceId, {
      source,
      gainNode,
      envelope,
      lfoGainNode: lfoNodes?.gainNode,
      lfoSource: lfoNodes?.source,
      panNode,
      sustainVolume,
    })

    source.onended = () => {
      lfoNodes?.source.disconnect()
      lfoNodes?.gainNode.disconnect()
      source.disconnect()
      gainNode.disconnect()
      panNode.disconnect()
      activeVoices.delete(voiceId)
    }
  }

  function stopAllVoices(releaseStartTime: number) {
    for (const voiceId of activeVoices.keys()) {
      scheduleVoiceStop(voiceId, releaseStartTime)
    }
  }

  return {
    createVoiceId,
    registerActiveVoice,
    scheduleVoiceStart,
    scheduleVoiceStop,
    stopAllVoices,
  }
}

const synthVoiceEngine = createSynthVoiceEngine()

export const createVoiceId = synthVoiceEngine.createVoiceId
export const registerActiveVoice = synthVoiceEngine.registerActiveVoice
export const scheduleVoiceStart = synthVoiceEngine.scheduleVoiceStart
export const scheduleVoiceStop = synthVoiceEngine.scheduleVoiceStop
export const scheduleAllVoicesStop = synthVoiceEngine.stopAllVoices
