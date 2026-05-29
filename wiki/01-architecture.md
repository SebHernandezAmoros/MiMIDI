# MiMIDI — Architecture

## Core principle: Screaming Architecture

The folder structure must talk about **music, MIDI, audio, instruments, and plugins** — not about React. Looking at the project, you should immediately understand what it does without reading a single line of code.

Instead of:
```
components/ hooks/ services/ utils/
```

MiMIDI organizes by musical domain:
```
engine/audio/   engine/midi/   features/piano/   features/timeline/
```

---

## Architectural principles

### 1. Small, stable, extensible core
The core does only what is essential: audio model, MIDI events, project structure, transport, persistence, and plugin contracts. Everything else is a plugin.

### 2. UI decoupled from the engine
React is the presentation layer. Components consume capabilities — they do not contain synthesis logic, MIDI logic, or business rules.

### 3. MIDI ≠ Audio
- **MIDI** = musical intention, events, time, structure
- **Audio** = sound generation, oscillators, envelopes, output

These two domains stay separate and coordinated, never merged.

### 4. Mathematical synthesis in the core
All core sound comes from oscillators, waveforms, ADSR envelopes, and parameters. No sample banks in the core. Samples belong in plugins.

### 5. Plugins as extension, not patch
The plugin system influences the architecture from day one. Module boundaries, public contracts, and event systems are designed to be pluggable.

---

## System layers

```
┌─────────────────────────────────────┐
│          Presentation               │  React components, navigation, UI state
├─────────────────────────────────────┤
│          Application                │  Use-cases, coordination (play, record, export)
├─────────────────────────────────────┤
│        Musical Domain               │  Project, Track, Clip, Note, Instrument, Preset
├─────────────────────────────────────┤
│         MIDI Engine                 │  Events, recording, playback, normalization
├─────────────────────────────────────┤
│         Audio Engine                │  Synthesis, oscillators, ADSR, WAV export
├─────────────────────────────────────┤
│        Infrastructure               │  Web Audio API, IndexedDB, serialization
├─────────────────────────────────────┤
│      Plugins / Extensions           │  .mimod format, plugin registry, API host
└─────────────────────────────────────┘
```

---

## Audio engine signal chain

Each voice follows this path:

```
OscillatorNode | AudioBufferSourceNode (noise)
  → GainNode          (ADSR envelope)
  → [WaveShaperNode]  (optional distortion — arctangent curve)
  → [BiquadFilterNode] (optional filter — highpass, bandpass…)
  → StereoPannerNode
  → masterGainNode
  → AudioContext.destination
```

Optional nodes are only created when requested. A plain sine wave goes directly from gain to pan.

---

## Folder structure

```
src/
  app/              ← bootstrap, layout, router, providers
  engine/
    audio/          ← audioEngine, WAV export, OfflineAudioContext
    midi/           ← events, recording, playback
  features/
    lab/            ← plugin registry, lab UI (LabApp)
    edit/           ← multi-track editor, piano roll timeline
    project/        ← project list, persistence
    perform/        ← performance view
    sampler/        ← SMC pad (8 synthetic percussion sounds)
    settings-view/
    history/        ← undo/redo (useProjectHistory)
    piano/
    timeline/
  domain/           ← musical types: Note, Track, Clip, Project…
  shared/           ← shared UI components, hooks, i18n, CSS tokens

public/
  demo-plugins/     ← plugin source + built .mimod files
    ataripunk/      ← AtariPunk Synth (React workspace)
    sfxr/           ← SFXR Generator (React workspace)
    motion-synth-pack/ ← Motion Synth Pack (instrument pack)

docs/               ← internal living documentation
wiki/               ← public documentation (this folder)
scripts/            ← plugin build tools (build-plugin.mjs, build-mimod.mjs)
```

---

## Track types

Tracks have a type that determines which view records to them:

| Type | Recorded from | Created by |
|------|--------------|------------|
| `"melodic"` | Piano view | `appendTrack()` |
| `"percussion"` | SMC Pad view | `appendPadTrack()` |

Each view filters tracks by its own type, preventing accidental overwrites. The Edit timeline shows all types together for the final mix.

A plugin can introduce new track types (e.g. `"sample"`) without modifying the core, by following the same pattern.

---

## Extension contracts

Three things a plugin can register:

1. **Instruments** — mathematical instrument definitions added to the core catalog
2. **Workspace** — a React component that gets its own panel inside MiMIDI
3. **Tool slots** *(planned)* — buttons injected into specific toolbars (`piano-toolbar`, `pad-toolbar`, `edit-toolbar`, `sampler-panel`)

---

## Quality checklist for architectural decisions

Before adding something to the core, ask:

- Does this belong in the core or in a plugin?
- Can it live decoupled from the rest?
- Are we mixing UI with domain logic?
- Does the structure still talk about the product, not the framework?
- Will this make plugins harder in the future?
- Does this add unnecessary weight to the core?
