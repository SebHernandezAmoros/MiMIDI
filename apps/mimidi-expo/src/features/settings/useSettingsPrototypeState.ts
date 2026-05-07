import { useState } from 'react';

const languages = ['Espanol', 'English', 'Portugues'] as const;
const audioOutputs = ['Dispositivo', 'Auriculares', 'Bluetooth'] as const;
const midiStatuses = ['No conectado', 'USB MIDI', 'Bluetooth MIDI'] as const;

export function useSettingsPrototypeState() {
  const [languageIndex, setLanguageIndex] = useState(0);
  const [audioOutputIndex, setAudioOutputIndex] = useState(0);
  const [midiStatusIndex, setMidiStatusIndex] = useState(0);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  function cycleLanguage() {
    setLanguageIndex((current) => (current + 1) % languages.length);
  }

  function toggleDarkMode() {
    setDarkModeEnabled((current) => !current);
  }

  function cycleAudioOutput() {
    setAudioOutputIndex((current) => (current + 1) % audioOutputs.length);
  }

  function cycleMidiStatus() {
    setMidiStatusIndex((current) => (current + 1) % midiStatuses.length);
  }

  return {
    audioOutput: audioOutputs[audioOutputIndex],
    cycleAudioOutput,
    cycleLanguage,
    cycleMidiStatus,
    darkModeEnabled,
    language: languages[languageIndex],
    midiStatus: midiStatuses[midiStatusIndex],
    toggleDarkMode,
  };
}
