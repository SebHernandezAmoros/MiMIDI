import { useMemo, useRef, useState } from "react"
import {
  startArpeggiatorPlayback,
  type ArpeggiatorHandle,
} from "../../application/use-cases/arpeggiatorPlayback"
import { playNote, playNotes } from "../../application/use-cases/playNote"
import {
  getSmcPadSoundDescriptor,
  PAD_SOUND_DEFAULTS,
  playSmcPadHit,
  type PadSoundParams,
  type SmcPadSoundId,
} from "../../application/use-cases/playSmcPadHit"
import { setMasterVolume } from "../../engine/audio/audioEngine"
import {
  createPlayOptions,
  type MathematicalInstrument,
} from "../../engine/audio/mathematicalInstruments"
import {
  createArpeggiatorSteps,
  defaultArpeggiatorSettings,
  type ArpeggiatorMode,
  type ArpeggiatorRate,
  type ArpeggiatorSettings,
  type ArpeggiatorStep,
} from "../../engine/midi/arpeggiator"
import {
  createMidiNoteEvent,
  createMidiRecordedNote,
  type MidiNoteEvent,
  type MidiNoteEventType,
} from "../../engine/midi/events"
import {
  createPianoPreviewNotes,
  previewOctaveOptions,
  transposeNote,
  type MusicalNote,
  type Octave,
} from "../../engine/midi/notes"
import {
  appendNoteToTrack,
  getTrackVolumeAutomationValue,
  type MusicalProject,
  type ProjectTrack,
} from "../../engine/project/projectModel"
import type { PianoInteractionMode } from "../piano/PianoPreview"

export type ChordType = "major" | "minor" | "power"

const chordIntervals: Record<ChordType, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  power: [0, 7, 12],
}

type RecordingState = "idle" | "recording"

type UseLabPerformOptions = {
  primaryTrack: ProjectTrack
  isPrimaryTrackAudible: boolean
  selectedInstrument: MathematicalInstrument
  getCurrentRecordTime: () => number
  recordNotesToActiveTrack: (notes: MusicalNote[], duration: number) => void
  recordNotesAtTime: (notes: MusicalNote[], duration: number, time: number) => void
  registerMidiEvent: (type: MidiNoteEventType, note: MusicalNote) => MidiNoteEvent
  recordingState: RecordingState
  applyUpdate: (fn: (p: MusicalProject) => MusicalProject) => void
  setProjectMessage: (msg: string) => void
  project: MusicalProject
}

export function useLabPerform({
  primaryTrack,
  isPrimaryTrackAudible,
  selectedInstrument,
  getCurrentRecordTime,
  recordNotesToActiveTrack,
  recordNotesAtTime,
  registerMidiEvent,
  recordingState,
  applyUpdate,
  setProjectMessage,
  project,
}: UseLabPerformOptions) {
  const [volume, setVolume] = useState(0.8)
  const [selectedNote, setSelectedNote] = useState<MusicalNote>("A4")
  const [selectedChordType, setSelectedChordType] = useState<ChordType>("major")
  const [pianoMode, setPianoMode] = useState<PianoInteractionMode>("note")
  const [arpeggiatorSettings, setArpeggiatorSettings] =
    useState<ArpeggiatorSettings>(defaultArpeggiatorSettings)
  const [previewOctave, setPreviewOctave] = useState<Octave>(4)
  const [midiEvents, setMidiEvents] = useState<MidiNoteEvent[]>([])

  const activeArpeggiatorHandleRef = useRef<ArpeggiatorHandle | null>(null)
  const activeArpeggiatorTriggerKeyRef = useRef<string | null>(null)

  const visibleNotes = useMemo(() => createPianoPreviewNotes(previewOctave), [previewOctave])

  // ── Volume ───────────────────────────────────────────────────────────────────
  function updateVolume(nextVolume: number) {
    setVolume(nextVolume)
    setMasterVolume(nextVolume)
  }

  // ── Octave ───────────────────────────────────────────────────────────────────
  function updatePreviewOctave(nextOctave: Octave) {
    const nextVisibleNotes = createPianoPreviewNotes(nextOctave)
    setPreviewOctave(nextOctave)
    if (!nextVisibleNotes.includes(selectedNote)) {
      const fallbackNote = `A${nextOctave}` as MusicalNote
      setSelectedNote(
        nextVisibleNotes.includes(fallbackNote) ? fallbackNote : nextVisibleNotes[0],
      )
    }
  }

  function stepPreviewOctave(direction: -1 | 1) {
    const currentIndex = previewOctaveOptions.findIndex((o) => o === previewOctave)
    const safeIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = Math.min(
      Math.max(safeIndex + direction, 0),
      previewOctaveOptions.length - 1,
    )
    updatePreviewOctave(previewOctaveOptions[nextIndex])
  }

  // ── Track playback state ─────────────────────────────────────────────────────
  function getTrackAutomationVolumeAtTime(time: number) {
    return getTrackVolumeAutomationValue(primaryTrack.volumeAutomation, time)
  }

  function getTrackLivePlaybackState(time: number) {
    return {
      pan: primaryTrack.pan,
      volume: primaryTrack.volume * getTrackAutomationVolumeAtTime(time),
    }
  }

  function getTrackPreviewPlayOptions(time: number) {
    const liveState = getTrackLivePlaybackState(time)
    return {
      ...createPlayOptions(
        selectedInstrument,
        isPrimaryTrackAudible ? liveState.volume : 0,
        primaryTrack.envelope,
      ),
      pan: liveState.pan,
    }
  }

  const basePreviewPlayOptions = {
    ...createPlayOptions(
      selectedInstrument,
      isPrimaryTrackAudible ? primaryTrack.volume : 0,
      primaryTrack.envelope,
    ),
    pan: primaryTrack.pan,
  }

  // ── Arpeggiator ──────────────────────────────────────────────────────────────
  function stopArpeggiator(resetTriggerKey = true) {
    activeArpeggiatorHandleRef.current?.stop()
    activeArpeggiatorHandleRef.current = null
    if (resetTriggerKey) activeArpeggiatorTriggerKeyRef.current = null
  }

  function buildArpeggiatorTriggerKey(sourceNotes: MusicalNote[]) {
    return sourceNotes.join("|")
  }

  function getArpeggiatorPreviewStepCount(steps: ArpeggiatorStep[]) {
    if (steps.length === 0) return 0
    if (arpeggiatorSettings.mode === "chord") return Math.max(2, arpeggiatorSettings.octaveRange)
    return steps.length
  }

  function playAndRecordStepNotes(notes: MusicalNote[], duration: number) {
    const interactionTime = getCurrentRecordTime()
    playNotes(notes, duration, getTrackPreviewPlayOptions(interactionTime))
    recordNotesAtTime(notes, duration, interactionTime)
  }

  function startArpeggiatorForNotes(
    sourceNotes: MusicalNote[],
    options: { maxSteps?: number } = {},
  ) {
    if (!arpeggiatorSettings.enabled || sourceNotes.length === 0) return
    stopArpeggiator(false)
    activeArpeggiatorTriggerKeyRef.current = buildArpeggiatorTriggerKey(sourceNotes)
    activeArpeggiatorHandleRef.current = startArpeggiatorPlayback({
      maxSteps: options.maxSteps,
      onStep: (notes, noteDuration) => {
        if (!isPrimaryTrackAudible) return
        playAndRecordStepNotes(notes, noteDuration)
      },
      settings: arpeggiatorSettings,
      sourceNotes,
    })
  }

  function triggerArpeggiatorPattern(sourceNotes: MusicalNote[]) {
    const steps = createArpeggiatorSteps(sourceNotes, arpeggiatorSettings)
    const maxSteps = getArpeggiatorPreviewStepCount(steps)
    if (maxSteps === 0) return
    startArpeggiatorForNotes(sourceNotes, { maxSteps })
    setProjectMessage(`Arpegio ${arpeggiatorSettings.mode} grabado en ${primaryTrack.name}.`)
  }

  // ── Chord / note helpers ─────────────────────────────────────────────────────
  function buildChordNotes(rootNote: MusicalNote) {
    return chordIntervals[selectedChordType].map((interval) =>
      transposeNote(rootNote, interval),
    )
  }

  function getPianoPlayableNotes(rootNote: MusicalNote) {
    return pianoMode === "chord" ? buildChordNotes(rootNote) : [rootNote]
  }

  // ── Play test note / chord ───────────────────────────────────────────────────
  function playTestNote() {
    if (arpeggiatorSettings.enabled) {
      triggerArpeggiatorPattern([selectedNote])
      return
    }
    playNote(selectedNote, 0.75, getTrackPreviewPlayOptions(getCurrentRecordTime()))
    recordNotesToActiveTrack([selectedNote], 0.75)
  }

  function playTestChord() {
    const chordNotes = buildChordNotes(selectedNote)
    if (arpeggiatorSettings.enabled) {
      triggerArpeggiatorPattern(chordNotes)
      return
    }
    const previewPlayOptions = getTrackPreviewPlayOptions(getCurrentRecordTime())
    playNotes(chordNotes, 1.15, {
      ...previewPlayOptions,
      volume: (previewPlayOptions.volume ?? 0) * 0.72,
    })
    recordNotesToActiveTrack(chordNotes, 1.15)
    setProjectMessage(`Acorde ${selectedChordType} grabado en ${primaryTrack.name}.`)
  }

  // ── Piano event handlers ─────────────────────────────────────────────────────
  function handleMidiEvent(type: MidiNoteEventType, note: MusicalNote) {
    const midiEvent = registerMidiEvent(type, note)
    setMidiEvents((current) => [midiEvent, ...current].slice(0, 12))
  }

  function handlePianoTriggerStart(rootNote: MusicalNote) {
    if (!arpeggiatorSettings.enabled) return
    const sourceNotes = getPianoPlayableNotes(rootNote)
    const triggerKey = buildArpeggiatorTriggerKey(sourceNotes)
    if (arpeggiatorSettings.latch && activeArpeggiatorTriggerKeyRef.current === triggerKey) {
      stopArpeggiator()
      setProjectMessage("Latch del arpegiador detenido.")
      return
    }
    startArpeggiatorForNotes(sourceNotes)
    setProjectMessage(`Arpegiador ${arpeggiatorSettings.mode} activo en ${primaryTrack.name}.`)
  }

  function handlePianoTriggerEnd(rootNote: MusicalNote) {
    if (!arpeggiatorSettings.enabled || arpeggiatorSettings.latch) return
    const sourceNotes = getPianoPlayableNotes(rootNote)
    const triggerKey = buildArpeggiatorTriggerKey(sourceNotes)
    if (activeArpeggiatorTriggerKeyRef.current === triggerKey) stopArpeggiator()
  }

  // ── Arpeggiator settings handlers ────────────────────────────────────────────
  function handleArpeggiatorEnabledChange(enabled: boolean) {
    if (!enabled) stopArpeggiator()
    setArpeggiatorSettings((s) => ({ ...s, enabled }))
  }

  function handleArpeggiatorModeChange(arpeMode: ArpeggiatorMode) {
    setArpeggiatorSettings((s) => ({ ...s, mode: arpeMode }))
  }

  function handleArpeggiatorRateChange(rate: ArpeggiatorRate) {
    setArpeggiatorSettings((s) => ({ ...s, rate }))
  }

  function handleArpeggiatorGateChange(gate: number) {
    setArpeggiatorSettings((s) => ({ ...s, gate: Math.min(Math.max(gate, 0.2), 1) }))
  }

  function handleArpeggiatorOctaveRangeChange(octaveRange: number) {
    setArpeggiatorSettings((s) => ({
      ...s,
      octaveRange: Math.min(Math.max(octaveRange, 1), 3),
    }))
  }

  function handleArpeggiatorLatchChange(latch: boolean) {
    if (!latch) activeArpeggiatorTriggerKeyRef.current = null
    setArpeggiatorSettings((s) => ({ ...s, latch }))
  }

  // ── SMC Pad ──────────────────────────────────────────────────────────────────
  function triggerSmcPad(soundId: SmcPadSoundId, velocity = 1) {
    const sound = getSmcPadSoundDescriptor(soundId)
    const startTime = getCurrentRecordTime()
    const liveState = getTrackLivePlaybackState(startTime)

    playSmcPadHit(
      soundId,
      isPrimaryTrackAudible ? liveState.volume : 0,
      liveState.pan,
      { ...PAD_SOUND_DEFAULTS[soundId], ...project.padSoundSettings[soundId], volume: velocity } as PadSoundParams,
    )

    if (recordingState === "recording") {
      applyUpdate((currentProject) =>
        appendNoteToTrack(
          currentProject,
          primaryTrack.id,
          createMidiRecordedNote(
            createMidiNoteEvent("note-on", sound.note, startTime, 1),
            startTime + sound.duration,
            primaryTrack.instrumentId,
            {
              playbackEnvelope: primaryTrack.envelope,
              playbackPan: primaryTrack.pan,
              playbackVolume: primaryTrack.volume,
              playbackSource: "smc-pad",
              playbackTrackId: primaryTrack.id,
              smcPadSoundId: sound.id,
            },
          ),
        ),
      )
      setProjectMessage(`${sound.label} grabado en ${primaryTrack.name}.`)
    }
  }

  // ── Misc ─────────────────────────────────────────────────────────────────────
  function clearMidiEvents() {
    setMidiEvents([])
  }

  return {
    // state
    volume,
    setVolume,
    selectedNote,
    setSelectedNote,
    selectedChordType,
    setSelectedChordType,
    pianoMode,
    setPianoMode,
    arpeggiatorSettings,
    setArpeggiatorSettings,
    previewOctave,
    midiEvents,
    // computed
    visibleNotes,
    basePreviewPlayOptions,
    // actions
    updateVolume,
    updatePreviewOctave,
    stepPreviewOctave,
    getTrackPreviewPlayOptions,
    getTrackAutomationVolumeAtTime,
    stopArpeggiator,
    buildChordNotes,
    getPianoPlayableNotes,
    playTestNote,
    playTestChord,
    handleMidiEvent,
    handlePianoTriggerStart,
    handlePianoTriggerEnd,
    handleArpeggiatorEnabledChange,
    handleArpeggiatorModeChange,
    handleArpeggiatorRateChange,
    handleArpeggiatorGateChange,
    handleArpeggiatorOctaveRangeChange,
    handleArpeggiatorLatchChange,
    triggerSmcPad,
    clearMidiEvents,
  }
}
