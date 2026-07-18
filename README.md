# MiMIDI

MiMIDI is a browser-based music laboratory for playing, recording, sequencing,
editing, exporting and extending musical ideas. It is built around mathematical
synthesis, MIDI-style event data, a timeline-based project model and a `.mimod`
plugin system.

The current primary product front is the web app. A parallel Expo prototype
exists in `apps/mimidi-expo`, but it is frozen for now and is not the source of
truth for product behavior.

> The UI is bilingual: Spanish and English. The codebase and plugin API are in
> English.

---

<!-- Screenshots -->

**Piano / Perform** - Play notes and chords, record takes, use arpeggiator mode,
and switch instruments per track.

![Piano](.github/assets/piano.png)

---

**Edit** - Timeline views for notes and tracks. Move clips, inspect lanes,
adjust timing, and use undo/redo.

![Edit](.github/assets/edit.png)

---

**Plugin manager** - Install, enable, disable and open `.mimod` plugins.

![Plugins](.github/assets/plugins.png)

---

**AtariPunk Synth** - Plugin workspace with square-wave chip synthesis and clip
recording.

![AtariPunk](.github/assets/ataripunk.png)

---

**SFXR Generator** - Plugin workspace for procedural 8-bit sound effects with
presets, mutation and WAV export.

![SFXR](.github/assets/sfxr.png)

---

## What Is MiMIDI?

MiMIDI is not just a piano screen. It is becoming a small DAW-like creative
system with:

- a mathematical synth core for notes, pads and instruments;
- MIDI-style events for recording and editing;
- project persistence and import/export;
- track timelines for melodic, percussion, sampler and audio-clip material;
- plugin workspaces and instrument packs;
- functional browser tests for critical user flows.

The guiding architecture is **Screaming Architecture**: folders and boundaries
should speak about music, MIDI, audio, tracks, timeline, project, sampler and
plugins before they speak about React.

Samples now exist as an isolated product capability through the sampler and
audio-clip tracks. The synth core remains mathematical; sample storage/playback
is kept behind explicit models, repositories and use-cases instead of being
mixed into UI components.

---

## Current Capabilities

### Music And Project

- Piano / Perform view with notes, chords, arpeggiator and per-track instruments
- SMC Pad with synthetic percussion sounds and pointer-position velocity
- Melodic Steps and Pad Beats sequencers
- Note timeline and track timeline
- MIDI tracks, sampler tracks and audio-clip tracks
- Per-track volume, mute, solo, pan, envelope and basic automation
- Project persistence in browser storage
- Import/export project as JSON
- Import/export `.mimidi` project bundle with sample data
- WAV export through `OfflineAudioContext`

### Editing And UX

- Move/resize notes and clips
- Snap, undo/redo, timeline duration controls
- Separate app views: Perform, Pad, Sampler, Edit, Project, Plugins, Settings
- Classic compact app shell with shared UI primitives
- Spanish/English UI
- Tutorial system

### Plugin System

- Install plugins from `.mimod` files
- Persist installed plugins through IndexedDB
- Enable/disable plugin entries per project
- Instrument-pack plugins
- React workspace plugins
- Plugin clip storage and plugin audio/MIDI outputs
- Demo plugins: Motion Synth Pack, AtariPunk Synth, SFXR Generator

---

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build production assets |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit/integration tests with Vitest |
| `npm run test:functional` | Run Puppeteer functional tests |
| `npm run test:all` | Run unit/integration + functional tests |

---

## Verification Status

The repo currently uses both unit/integration tests and browser-level functional
tests.

```bash
npm run test
npm run test:functional
npm run build
```

There is also an architecture boundary suite in `src/architecture.test.ts` that
guards important refactor decisions, such as:

- `engine/**` does not import React or `app/**`;
- `domain/**` stays independent from UI/browser APIs;
- `application/**` stays independent from React and direct browser APIs;
- feature slices do not import the legacy `features/lab` composition;
- current track kinds are registered across data handlers, lanes and schedulers.

---

## Plugin Development

### Build Demo Plugins

```bash
# Instrument pack
npm run plugin:pack motion-synth-pack

# React workspace plugins
npm run plugin:build ataripunk
npm run plugin:build sfxr
```

Output:

```text
public/demo-plugins/<plugin-id>/<plugin-id>.mimod
```

### Plugin Format

A `.mimod` file is a ZIP with:

```text
my-plugin.mimod
+-- manifest.json
+-- index.js
```

`index.js` must be a self-contained ESM bundle. React workspace plugins use the
host React runtime exposed through `globalThis.__MIMIDI_RUNTIME__`; they must not
bundle their own copy of React.

Full public type declarations live at:

```text
public/mimidi-plugin-sdk.d.ts
```

For the full guide, see [wiki/02-plugin-guide.md](wiki/02-plugin-guide.md).

---

## Architecture Snapshot

```text
src/
  app/                  app shell, navigation and top-level compositions
  application/
    ports/              repository/file/timer contracts
    use-cases/          commands, transfers, playback, export/import
  domain/
    project/            pure project, track, clip and timeline rules
    plugins/            pure plugin contracts/manifests
    midi/               shared MIDI domain types
  engine/
    audio/              Web Audio facade + synth/sample/FX modules
    midi/               note/event/arpeggiator logic
    plugins/            plugin loading/registry compatibility facades
    project/            projectModel compatibility facade
  infrastructure/
    storage/            localStorage/IndexedDB adapters
    files/              browser file-save adapter
    timing/             browser timer adapter
  features/
    lab/                legacy compatibility composition
    project-session/    shared project session hooks/provider
    perform/ edit/ project-view/ plugins-view/
    sampler/ audio-sampler/ timeline/ piano/
    step-sequencer/ pad-sequencer/ tutorial/
  plugin-host/          React plugin host API/runtime boundary

e2e/                    Puppeteer functional tests
public/demo-plugins/    plugin source + generated .mimod files
wiki/                   public documentation
```

The refactor deliberately keeps compatibility facades where needed:

- `features/lab/LabApp.tsx` is still the legacy composition for several views.
- `engine/project/projectModel.ts` re-exports the split project domain.
- `engine/audio/audioEngine.ts` is a facade over smaller audio modules.
- `engine/plugins/pluginModel.ts` keeps compatibility while pure contracts live
  in `domain/plugins` and React-specific contracts live in `plugin-host`.

---

## Tech Stack

| Area | Tool |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Audio | Web Audio API |
| Plugin packaging | esbuild + fflate |
| Storage | localStorage + IndexedDB behind adapters |
| Icons | lucide-react |
| Unit/integration tests | Vitest + Testing Library |
| Functional tests | Vitest + Puppeteer |
| PWA | vite-plugin-pwa |

---

## Documentation

| Path | Purpose |
|---|---|
| [wiki/](wiki/00-README.md) | Public-facing architecture, plugin guide and roadmap |

---

## License

[MIT + Commons Clause](LICENSE) - free to use, study and contribute.
Commercial use requires permission from the author.
