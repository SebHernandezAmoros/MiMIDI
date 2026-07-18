# MiMIDI - Architecture

## Core Principle: Screaming Architecture

MiMIDI is organized around product capabilities and musical domains:

- audio;
- MIDI;
- project;
- tracks and clips;
- timeline;
- sampler;
- plugins;
- app views.

The codebase should make it obvious that this is a music system before it makes
it obvious that it uses React.

---

## Current Architectural State

MiMIDI started as a lab-style app and grew quickly. A major refactor has been
moving responsibilities out of a few central files into clearer layers while
keeping compatibility facades so the product stays usable.

The important current truth:

- the web app is the product source of truth;
- `features/lab/LabApp.tsx` still exists as a legacy compatibility composition;
- `Project`, `Plugins`, and parts of the app shell have newer compositions;
- `Perform`, `Edit`, and `Sampler/Pad` still route through `LabApp` facades;
- architecture rules are guarded by `src/architecture.test.ts`;
- browser functional flows are covered in `e2e/functional`.

---

## Layers

```text
src/
  app/
    AppMode.tsx
    *Composition.tsx
    navigation, shell, app settings

  domain/
    project/
      pure project, track, clip, timeline and migration rules
    plugins/
      pure plugin manifests and contribution contracts
    midi/
      shared MIDI domain types

  application/
    ports/
      ProjectRepository, SampleRepository, SettingsRepository,
      ExternalPluginRepository, FileSavePort, PlaybackTimerPort
    use-cases/
      playback, export/import, project transfers, settings,
      plugins, samples, schedulers

  infrastructure/
    storage/
      localStorage and IndexedDB adapters
    files/
      browser file save adapter
    timing/
      browser timer adapter

  engine/
    audio/
      Web Audio facade plus synth, sample playback, FX, WAV and renderer modules
    midi/
      note/event/arpeggiator logic
    plugins/
      loader/registry compatibility facades
    project/
      projectModel compatibility facade

  features/
    project-session/
      shared project session hooks and provider
    timeline/
      track lane view models, lane components and drag helpers
    perform/ edit/ project-view/ plugins-view/
    sampler/ audio-sampler/ piano/
    step-sequencer/ pad-sequencer/ tutorial/
    lab/
      legacy controlled composition

  plugin-host/
    React plugin host API and runtime boundary
```

---

## Refactor Boundaries

### Compatibility Facades

Several files remain intentionally as facades:

| Facade | Current role |
|---|---|
| `features/lab/LabApp.tsx` | Legacy composition for lab and some app views |
| `features/lab/useLabProject.ts` | Compatibility facade over project-session hooks |
| `engine/project/projectModel.ts` | Re-export facade over `domain/project` |
| `engine/audio/audioEngine.ts` | Public facade over smaller audio modules |
| `engine/plugins/pluginModel.ts` | Compatibility facade over domain/plugin-host contracts |

New work should avoid adding responsibilities to these files unless the change
is explicitly part of a planned compatibility layer.

### Architecture Tests

`src/architecture.test.ts` protects the current boundaries. Among other checks,
it verifies:

- `engine/**` does not import React or `app/**`;
- `domain/**` does not import UI or browser APIs;
- `application/**` does not import React or direct browser APIs;
- feature slices outside `features/lab` do not import the lab composition;
- track kinds are registered across data handlers, lanes and schedulers;
- plugin React contracts stay outside the pure plugin domain.

---

## Audio Architecture

The public audio API is still exposed through `engine/audio/audioEngine.ts`, but
its internals are split into smaller modules:

```text
engine/audio/
  audioTypes.ts
  audioContextManager.ts
  masterOutput.ts
  synthVoiceEngine.ts
  oscillatorEngine.ts
  noiseEngine.ts
  lfoEngine.ts
  fxChain.ts
  sampleCalibration.ts
  samplePlaybackEngine.ts
  offlineAudioRenderer.ts
  wavEncoder.ts
  audioEngine.ts          compatibility facade
```

The synth core remains mathematical: oscillators, envelopes, LFO, filters,
distortion, noise and generated percussion. The app also has sampler and
audio-clip capabilities, but those are treated as isolated product modules with
storage/playback contracts, not as random UI-side audio code.

---

## MIDI And Project Model

MIDI represents musical intention: notes, timing, velocity and playback source.
Audio represents sound generation and rendering. These are intentionally
separate.

Project rules now live mostly under `domain/project`, with `projectModel.ts`
kept for backwards-compatible imports.

Important track concepts:

| Track kind | Purpose |
|---|---|
| `midi` | Melodic, percussion and steps note data |
| `sampler` | Sequencer/sample pattern tracks |
| `audio-clip` | Rendered or recorded audio blobs on the timeline |

Important MIDI track types:

| Track type | Used by |
|---|---|
| `melodic` | Piano / Perform |
| `percussion` | Pads and Beats |
| `steps` | Melodic step sequencer |

Current timeline rendering uses track data handlers, lane definitions and track
schedulers so new track behavior can become more declarative over time.

---

## Plugins

Plugin responsibilities are split by layer:

```text
domain/plugins/       pure manifest and contribution contracts
engine/plugins/       loading, registry and compatibility facades
plugin-host/          React workspace API/runtime boundary
features/plugins-view/ UI and user workflows for plugins
```

A plugin can contribute:

- mathematical instruments;
- a React workspace;
- outputs sent back to the host, such as MIDI or audio;
- tool slots, where supported by the host UI.

Plugins are loaded dynamically and are not sandboxed yet. Users should only
install plugins they trust.

---

## Storage And Ports

Browser storage is intentionally behind ports/adapters:

- `ProjectRepository`;
- `SampleRepository`;
- `SampleSlotRepository`;
- `SettingsRepository`;
- `ExternalPluginRepository`;
- `FileSavePort`;
- `PlaybackTimerPort`.

Features should not reach directly for `localStorage`, `indexedDB`, `window` or
`document` unless the feature is explicitly a browser-facing adapter or UI shell.

---

## Testing Strategy

MiMIDI uses several layers of tests:

- domain and use-case tests with Vitest;
- React integration tests with Testing Library;
- architecture boundary tests;
- Puppeteer functional tests for real browser flows.

Functional tests currently cover:

- app smoke and navigation;
- arpeggiator controls and flow;
- Beats step-count persistence;
- Pads/Beats clarity in the Edit track timeline.

---

## Decision Checklist

Before adding a feature, ask:

- What domain does it touch?
- Can the UI call an application use-case instead of a low-level engine module?
- Does it require storage? If yes, is there a repository/port?
- Does it add a track behavior? If yes, does it need a data handler, lane or scheduler?
- Does it add audio behavior? If yes, can it live behind an audio module/facade?
- Does it add plugin surface? If yes, is it pure contract, host runtime or UI?
- Can it avoid adding responsibility to `LabApp`, `projectModel` and `audioEngine`?
