import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useRef } from 'react';
import {
  createToneFilename,
  createToneWavBytes,
} from './performToneWav';

export type PerformPrototypeAudio = {
  pressNote: (note: string) => void;
  releaseNote: (note: string) => void;
  stopAllNotes: () => void;
};

type ActiveVoice = {
  player: AudioPlayer;
};

const toneDirectory = new Directory(Paths.cache, 'mimidi-perform-tones');
const preparedNoteUris = new Map<string, Promise<string>>();

export function usePerformPrototypeAudio(): PerformPrototypeAudio {
  const activeVoicesRef = useRef<Map<string, ActiveVoice>>(new Map());
  const audioModeReadyRef = useRef(false);
  const audioModeRejectedRef = useRef(false);

  useEffect(() => {
    return () => {
      stopAllNotes();
    };
  }, []);

  async function ensureAudioMode() {
    if (audioModeReadyRef.current || audioModeRejectedRef.current) {
      return;
    }

    try {
      await setAudioModeAsync({
        interruptionMode: 'mixWithOthers',
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      audioModeReadyRef.current = true;
    } catch (error) {
      audioModeRejectedRef.current = true;
      console.warn('mimidi-expo perform audio mode rejected', error);
    }
  }

  async function ensureToneUri(note: string) {
    const cached = preparedNoteUris.get(note);

    if (cached) {
      return cached;
    }

    const pendingUri = Promise.resolve().then(() => {
      toneDirectory.create({
        idempotent: true,
        intermediates: true,
      });

      const toneFile = new File(toneDirectory, createToneFilename(note));

      if (!toneFile.exists) {
        toneFile.create({
          intermediates: true,
          overwrite: true,
        });
        toneFile.write(createToneWavBytes(note));
      }

      return toneFile.uri;
    });

    preparedNoteUris.set(note, pendingUri);

    return pendingUri;
  }

  function pressNote(note: string) {
    if (activeVoicesRef.current.has(note)) {
      return;
    }

    void (async () => {
      await ensureAudioMode();
      const toneUri = await ensureToneUri(note);

      if (activeVoicesRef.current.has(note)) {
        return;
      }

      const player = createAudioPlayer({ uri: toneUri });
      player.volume = 0.95;
      player.play();
      activeVoicesRef.current.set(note, { player });
    })();
  }

  function releaseNote(note: string) {
    const activeVoice = activeVoicesRef.current.get(note);

    if (!activeVoice) {
      return;
    }

    activeVoice.player.pause();
    activeVoice.player.remove();
    activeVoicesRef.current.delete(note);
  }

  function stopAllNotes() {
    activeVoicesRef.current.forEach((voice) => {
      voice.player.pause();
      voice.player.remove();
    });
    activeVoicesRef.current.clear();
  }

  return {
    pressNote,
    releaseNote,
    stopAllNotes,
  };
}
