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

const SAMPLE_RATE = 22050;
const DURATION_SECONDS = 3;
const AMPLITUDE = 0.22;

export function noteToFrequency(note: string) {
  const match = /^([A-G]#?)(\d)$/.exec(note);

  if (!match) {
    return 440;
  }

  const [, noteName, octaveString] = match;
  const octave = Number(octaveString);
  const midiNumber = (octave + 1) * 12 + NOTE_INDEX[noteName];

  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export function createToneFilename(note: string) {
  return `${note.replace('#', 's')}.wav`;
}

export function createToneWavBytes(note: string) {
  const totalSamples = SAMPLE_RATE * DURATION_SECONDS;
  const pcmData = new Int16Array(totalSamples);
  const frequency = noteToFrequency(note);

  for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex += 1) {
    const time = sampleIndex / SAMPLE_RATE;
    const normalizedTime = sampleIndex / totalSamples;
    const attack = Math.min(1, time / 0.02);
    const tail = Math.min(1, Math.max(0, (DURATION_SECONDS - time) / 0.18));
    const sustain = normalizedTime < 0.12 ? 0.85 + normalizedTime : 0.85;
    const envelope = attack * tail * sustain;
    const sample =
      Math.sin(2 * Math.PI * frequency * time) * AMPLITUDE * envelope;

    pcmData[sampleIndex] = Math.max(-1, Math.min(1, sample)) * 32767;
  }

  const dataByteLength = pcmData.length * 2;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataByteLength, true);

  let offset = 44;
  for (const sample of pcmData) {
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
