import type { MiMIDIPluginDefinition } from "./pluginModel"

export const internalPlugins: MiMIDIPluginDefinition[] = [
  {
    description:
      "Extiende el laboratorio con leads y pads matematicos adicionales sin usar samples.",
    enabledByDefault: true,
    id: "motion-synth-pack",
    instruments: {
      instruments: [
        {
          category: "base",
          id: "glass-pluck",
          name: "Glass Pluck",
          waveform: "triangle",
          volume: 0.2,
          envelope: {
            attack: 0.004,
            decay: 0.16,
            sustain: 0.18,
            release: 0.1,
          },
        },
        {
          category: "advanced",
          id: "pulse-drift",
          name: "Pulse Drift",
          waveform: "square",
          volume: 0.14,
          envelope: {
            attack: 0.012,
            decay: 0.1,
            sustain: 0.56,
            release: 0.18,
          },
          lfo: {
            depth: 7,
            rate: 3.4,
            waveform: "triangle",
          },
        },
      ],
    },
    name: "Motion Synth Pack",
    version: "0.1.0",
  },
]
