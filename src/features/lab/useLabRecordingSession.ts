import { useRef, useState } from "react"
import type { ADSREnvelope } from "../../engine/audio/audioEngine"
import type { MathematicalInstrumentId } from "../../engine/audio/mathematicalInstruments"
import {
  createMidiRecordedNote,
  createMidiNoteEvent,
  type MidiNoteEvent,
  type MidiNoteEventType,
} from "../../engine/midi/events"
import type { MusicalNote } from "../../engine/midi/notes"
import {
  appendNoteToTrack,
  appendNotesToTrack,
  type MusicalProject,
  type ProjectTrack,
} from "../../engine/project/projectModel"

type RecordingState = "idle" | "recording"

type ActiveNoteCapture = {
  automationVolume: number
  noteOnEvent: MidiNoteEvent
}

type UseLabRecordingSessionOptions = {
  getPerformanceTimestamp: () => number
  getTrackAutomationVolumeAtTime: (time: number) => number
  onProjectUpdate: (
    updater: (currentProject: MusicalProject) => MusicalProject,
  ) => void
  onStopArpeggiator: () => void
  onStopPlayback: () => void
  onStopRecording?: () => void
  onUpdateMessage: (message: string) => void
  primaryTrack: ProjectTrack
}

function buildRecordedNoteOptions(
  envelope: ADSREnvelope,
  instrumentId: MathematicalInstrumentId,
  pan: number,
  trackId: string,
  volume: number,
  automationVolume: number,
) {
  return {
    instrumentId,
    options: {
      playbackEnvelope: envelope,
      playbackPan: pan,
      playbackSource: "note" as const,
      playbackTrackId: trackId,
      playbackVolume: volume * automationVolume,
    },
  }
}

export function useLabRecordingSession({
  getPerformanceTimestamp,
  getTrackAutomationVolumeAtTime,
  onProjectUpdate,
  onStopArpeggiator,
  onStopPlayback,
  onStopRecording,
  onUpdateMessage,
  primaryTrack,
}: UseLabRecordingSessionOptions) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const activeNoteEventsRef = useRef<Record<string, ActiveNoteCapture>>({})
  const labStartedAtRef = useRef<number | null>(null)
  const recordingStartedAtRef = useRef<number | null>(null)

  function getCurrentLabTime() {
    const now = getPerformanceTimestamp()

    if (labStartedAtRef.current === null) {
      labStartedAtRef.current = now
    }

    return Math.max((now - labStartedAtRef.current) / 1000, 0)
  }

  function getCurrentRecordTime() {
    if (recordingState !== "recording") {
      return getCurrentLabTime()
    }

    const now = getPerformanceTimestamp()

    if (recordingStartedAtRef.current === null) {
      recordingStartedAtRef.current = now
    }

    return Math.max((now - recordingStartedAtRef.current) / 1000, 0)
  }

  function recordNotesAtTime(
    notes: MusicalNote[],
    duration: number,
    interactionTime: number,
  ) {
    if (recordingState !== "recording" || notes.length === 0) {
      return
    }

    const automationVolume = getTrackAutomationVolumeAtTime(interactionTime)
    const noteOptions = buildRecordedNoteOptions(
      primaryTrack.envelope,
      primaryTrack.instrumentId,
      primaryTrack.pan,
      primaryTrack.id,
      primaryTrack.volume,
      automationVolume,
    )
    const recordedNotes = notes.map((note) =>
      createMidiRecordedNote(
        createMidiNoteEvent("note-on", note, interactionTime, 1),
        interactionTime + duration,
        noteOptions.instrumentId,
        noteOptions.options,
      ),
    )

    onProjectUpdate((currentProject) =>
      appendNotesToTrack(currentProject, primaryTrack.id, recordedNotes),
    )
  }

  function recordNotesToActiveTrack(notes: MusicalNote[], duration: number) {
    recordNotesAtTime(notes, duration, getCurrentRecordTime())
  }

  function registerMidiEvent(type: MidiNoteEventType, note: MusicalNote) {
    const eventTime = getCurrentRecordTime()
    const midiEvent = createMidiNoteEvent(type, note, eventTime, 1)

    if (recordingState !== "recording") {
      return midiEvent
    }

    if (type === "note-on") {
      activeNoteEventsRef.current[note] = {
        automationVolume: getTrackAutomationVolumeAtTime(eventTime),
        noteOnEvent: midiEvent,
      }

      return midiEvent
    }

    const activeNoteCapture = activeNoteEventsRef.current[note]

    if (!activeNoteCapture) {
      return midiEvent
    }

    const noteOptions = buildRecordedNoteOptions(
      primaryTrack.envelope,
      primaryTrack.instrumentId,
      primaryTrack.pan,
      primaryTrack.id,
      primaryTrack.volume,
      activeNoteCapture.automationVolume,
    )

    onProjectUpdate((currentProject) =>
      appendNoteToTrack(
        currentProject,
        primaryTrack.id,
        createMidiRecordedNote(
          activeNoteCapture.noteOnEvent,
          eventTime,
          noteOptions.instrumentId,
          noteOptions.options,
        ),
      ),
    )

    delete activeNoteEventsRef.current[note]

    return midiEvent
  }

  function startRecording() {
    onStopPlayback()
    onStopArpeggiator()
    activeNoteEventsRef.current = {}
    recordingStartedAtRef.current = getPerformanceTimestamp()
    setRecordingState("recording")
    onUpdateMessage(`Grabacion iniciada en ${primaryTrack.name}.`)
  }

  function stopRecording() {
    if (recordingState !== "recording") {
      return
    }

    const stopTime = getCurrentRecordTime()
    const unfinishedNotes = Object.values(activeNoteEventsRef.current)

    if (unfinishedNotes.length > 0) {
      const recordedNotes = unfinishedNotes.map((capture) => {
        const noteOptions = buildRecordedNoteOptions(
          primaryTrack.envelope,
          primaryTrack.instrumentId,
          primaryTrack.pan,
          primaryTrack.id,
          primaryTrack.volume,
          capture.automationVolume,
        )

        return createMidiRecordedNote(
          capture.noteOnEvent,
          stopTime,
          noteOptions.instrumentId,
          noteOptions.options,
        )
      })

      onProjectUpdate((currentProject) =>
        appendNotesToTrack(currentProject, primaryTrack.id, recordedNotes),
      )
    }

    activeNoteEventsRef.current = {}
    recordingStartedAtRef.current = null
    setRecordingState("idle")
    onUpdateMessage(`Grabacion detenida en ${primaryTrack.name}.`)
    onStopRecording?.()
  }

  function resetRecordingSession() {
    activeNoteEventsRef.current = {}
    labStartedAtRef.current = null
    recordingStartedAtRef.current = null
    setRecordingState("idle")
  }

  return {
    getCurrentRecordTime,
    recordNotesAtTime,
    recordNotesToActiveTrack,
    recordingState,
    registerMidiEvent,
    resetRecordingSession,
    startRecording,
    stopRecording,
  }
}
