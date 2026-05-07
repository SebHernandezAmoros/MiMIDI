import { useMemo, useState } from 'react';

const NATURAL_NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const SHARP_NOTE_NAMES = ['C#', 'D#', 'F#', 'G#', 'A#'] as const;
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 7;

export type PerformTransportState = 'idle' | 'recording';

type SharpKeyDefinition = {
  leftIndex: number;
  note: string;
};

function clampOctave(nextOctave: number) {
  return Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, nextOctave));
}

function createNaturalKeys(octave: number) {
  return NATURAL_NOTE_NAMES.map((noteName, index) => {
    const noteOctave = index === NATURAL_NOTE_NAMES.length - 1 ? octave + 1 : octave;
    return `${noteName}${noteOctave}`;
  });
}

function createSharpKeys(octave: number): SharpKeyDefinition[] {
  return [
    { leftIndex: 0, note: `${SHARP_NOTE_NAMES[0]}${octave}` },
    { leftIndex: 1, note: `${SHARP_NOTE_NAMES[1]}${octave}` },
    { leftIndex: 3, note: `${SHARP_NOTE_NAMES[2]}${octave}` },
    { leftIndex: 4, note: `${SHARP_NOTE_NAMES[3]}${octave}` },
    { leftIndex: 5, note: `${SHARP_NOTE_NAMES[4]}${octave}` },
  ];
}

export function usePerformPrototypeState() {
  const [octave, setOctave] = useState(4);
  const [trackCount, setTrackCount] = useState(1);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [transportState, setTransportState] =
    useState<PerformTransportState>('idle');
  const [activeNote, setActiveNote] = useState<string | null>(`C4`);
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(`C4`);

  const naturalKeys = useMemo(() => createNaturalKeys(octave), [octave]);
  const sharpKeys = useMemo(() => createSharpKeys(octave), [octave]);

  const currentTrackLabel = `Track ${activeTrackIndex + 1}`;
  const canGoPreviousTrack = activeTrackIndex > 0;
  const canGoNextTrack = activeTrackIndex < trackCount - 1;
  const canDecreaseOctave = octave > MIN_OCTAVE;
  const canIncreaseOctave = octave < MAX_OCTAVE;

  function addTrack() {
    setTrackCount((currentCount) => {
      const nextCount = currentCount + 1;
      setActiveTrackIndex(nextCount - 1);
      return nextCount;
    });
  }

  function selectPreviousTrack() {
    setActiveTrackIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function selectNextTrack() {
    setActiveTrackIndex((currentIndex) =>
      Math.min(trackCount - 1, currentIndex + 1),
    );
  }

  function decreaseOctave() {
    setOctave((currentOctave) => clampOctave(currentOctave - 1));
  }

  function increaseOctave() {
    setOctave((currentOctave) => clampOctave(currentOctave + 1));
  }

  function activateNote(note: string) {
    setActiveNote(note);
    setLastPlayedNote(note);
  }

  function releaseNote(note: string) {
    setActiveNote((currentActiveNote) =>
      currentActiveNote === note ? null : currentActiveNote,
    );
  }

  function toggleRecording() {
    setTransportState((currentState) =>
      currentState === 'recording' ? 'idle' : 'recording',
    );
  }

  function stopTransport() {
    setTransportState('idle');
    setActiveNote(null);
  }

  return {
    activeNote,
    addTrack,
    canDecreaseOctave,
    canGoNextTrack,
    canGoPreviousTrack,
    canIncreaseOctave,
    currentTrackLabel,
    decreaseOctave,
    increaseOctave,
    isRecording: transportState === 'recording',
    lastPlayedNote,
    naturalKeys,
    octave,
    releaseNote,
    selectNextTrack,
    selectPreviousTrack,
    sharpKeys,
    stopTransport,
    toggleRecording,
    trackCount,
    transportState,
    activateNote,
  };
}
