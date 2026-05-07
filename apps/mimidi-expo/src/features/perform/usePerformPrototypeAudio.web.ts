import { useRef } from 'react';

export type PerformPrototypeAudio = {
  pressNote: (note: string) => void;
  releaseNote: (note: string) => void;
  stopAllNotes: () => void;
};

type ActiveVoice = {
  gainNode: GainNode;
  oscillator: OscillatorNode;
};

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
};

function noteToFrequency(note: string) {
  const match = /^([A-G]#?)(\d)$/.exec(note);

  if (!match) {
    return 440;
  }

  const [, noteName, octaveString] = match;
  const octave = Number(octaveString);
  const midiNumber = (octave + 1) * 12 + NOTE_INDEX[noteName];

  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export function usePerformPrototypeAudio(): PerformPrototypeAudio {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeVoicesRef = useRef<Map<string, ActiveVoice>>(new Map());

  function ensureAudioContext() {
    if (typeof window === 'undefined') {
      return null;
    }

    const Context = window.AudioContext ?? window.webkitAudioContext;

    if (!Context) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new Context();
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  function pressNote(note: string) {
    if (activeVoicesRef.current.has(note)) {
      return;
    }

    const audioContext = ensureAudioContext();

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(noteToFrequency(note), now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);

    activeVoicesRef.current.set(note, { gainNode, oscillator });
  }

  function releaseNote(note: string) {
    const audioContext = audioContextRef.current;
    const activeVoice = activeVoicesRef.current.get(note);

    if (!audioContext || !activeVoice) {
      return;
    }

    const now = audioContext.currentTime;

    activeVoice.gainNode.gain.cancelScheduledValues(now);
    activeVoice.gainNode.gain.setValueAtTime(
      Math.max(activeVoice.gainNode.gain.value, 0.0001),
      now,
    );
    activeVoice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    activeVoice.oscillator.stop(now + 0.16);
    activeVoicesRef.current.delete(note);
  }

  function stopAllNotes() {
    const audioContext = audioContextRef.current;

    if (!audioContext) {
      activeVoicesRef.current.clear();
      return;
    }

    const now = audioContext.currentTime;

    activeVoicesRef.current.forEach((voice) => {
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(
        Math.max(voice.gainNode.gain.value, 0.0001),
        now,
      );
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      voice.oscillator.stop(now + 0.1);
    });

    activeVoicesRef.current.clear();
  }

  return {
    pressNote,
    releaseNote,
    stopAllNotes,
  };
}
