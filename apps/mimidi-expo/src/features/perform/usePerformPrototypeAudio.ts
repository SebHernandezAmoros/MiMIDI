export type PerformPrototypeAudio = {
  pressNote: (note: string) => void;
  releaseNote: (note: string) => void;
  stopAllNotes: () => void;
};

export function usePerformPrototypeAudio(): PerformPrototypeAudio {
  return {
    pressNote: () => {},
    releaseNote: () => {},
    stopAllNotes: () => {},
  };
}
