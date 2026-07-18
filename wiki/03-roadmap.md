# MiMIDI - Roadmap

## Development Philosophy

```text
Make it work -> separate it -> refine it -> expand it
```

MiMIDI is being developed as a living music system, not as a throwaway demo.
The current priority is stability and clear boundaries before large new feature
surfaces.

---

## Foundation Status

| Area | Status |
|---|---|
| Audio core | Implemented, now modularized behind `audioEngine` facade |
| Note/MIDI system | Implemented |
| Piano / Perform | Implemented, still partially routed through `LabApp` facade |
| Recording | Implemented |
| Note timeline | Implemented |
| Track timeline | Implemented with data handlers, lane view models and schedulers |
| Project persistence | Implemented |
| JSON / `.mimidi` bundle transfer | Implemented |
| WAV export | Implemented |
| Plugins | Implemented with compatibility facades and newer domain/plugin-host split |
| Functional tests | Implemented with Puppeteer |
| Expo app | Frozen prototype, not current product front |

---

## What Works Today

- Piano / Perform view with notes, chords and arpeggiator
- Per-track mathematical instruments
- SMC Pad with synthetic percussion
- Melodic Steps and Pad Beats sequencers
- Note editing with move/resize/snap
- Track timeline with MIDI, sampler and audio-clip tracks
- Pads/Beats shown clearly as separate percussion timeline lanes when needed
- Undo/redo
- Project import/export as JSON
- Project bundle import/export with sample data
- WAV export through offline rendering
- Plugin manager with `.mimod` import
- Plugin workspaces and instrument packs
- Installed plugin persistence
- Spanish/English UI
- Architecture boundary tests
- Puppeteer functional tests

---

## Recent Architectural Refactor

The project used to concentrate too much behavior in a few large files:

- `LabApp.tsx`;
- `useLabProject.ts`;
- `projectModel.ts`;
- `audioEngine.ts`.

The refactor moved responsibilities into:

- `domain/project`;
- `domain/plugins`;
- `application/use-cases`;
- `application/ports`;
- `infrastructure/storage`;
- `features/project-session`;
- `features/plugins-view`;
- `plugin-host`;
- track data handlers, lane definitions and schedulers.

The old files remain as compatibility facades where needed. The goal is
evolution without breaking the working app.

---

## Current Priority

### 1. Keep Stabilizing The Web App

The web app is the current product source of truth. New work should:

- avoid adding new responsibilities to `LabApp`;
- enter through domain/use-cases/ports where possible;
- add tests before important behavior changes;
- keep `npm run test`, `npm run test:functional` and `npm run build` green.

### 2. Finish Small Product Fixes With TDD

Recent functional plans focus on flows such as:

- Beats step-count persistence;
- Pads/Beats clarity in the timeline;
- arpeggiator visibility and interaction;
- future beat markers and drag-to-paint improvements.

### 3. Continue Gradual Feature Extraction

Perform, Edit and Sampler still use legacy `LabApp` compositions. Future work
should continue extracting real feature roots without destroying the lab
sandbox.

### 4. Improve Timeline And Sequencer UX

Planned improvements include:

- stronger beat/bar markers in Steps, Beats and Sampler grids;
- dynamic markers based on subdivision;
- drag-to-paint for step grids;
- clearer piano-roll style editing later as a separate larger plan.

### 5. Sampler / FX / Audio-Clip Polish

Important future audio work:

- EQ, reverb and delay for sampler slots;
- consistent live/export FX behavior;
- more robust audio-clip timeline behavior;
- storage cleanup and bundle portability guarantees.

---

## Plugin Roadmap

Demo plugins:

| Plugin | Status |
|---|---|
| Motion Synth Pack | Available |
| AtariPunk Synth | Available |
| SFXR Generator | Available |

Backlog ideas:

| Plugin | Idea |
|---|---|
| Wave Designer | Draw or shape custom waveforms |
| Bitcrusher | Bit depth / sample-rate reduction |
| Pattern Generator | Procedural MIDI patterns |
| Oscillator | Standalone oscillator workspace |
| Circuit Bending | Experimental sound mangling |
| Cassette | Tape-style playback/visual workspace |
| Sample Library | Reference sampled-instrument plugin |

---

## Release Direction

Short-term release direction:

- publish a stable web demo first;
- keep the app installable as PWA where possible;
- document plugin creation clearly;
- keep Expo frozen until the web product is more mature.

Longer-term possibilities:

- formal monorepo split into `apps/web`, `apps/mobile`, `packages/core`;
- mobile app from a shared core, not from a parallel rewrite;
- public plugin SDK and templates;
- code splitting/performance pass for the large app chunk.

---

## Anti-Patterns We Avoid

- Adding new feature modes directly to `LabApp`
- Putting synthesis, storage or project rules inside React components
- Adding browser API access inside `domain` or `application`
- Expanding `projectModel.ts` or `audioEngine.ts` instead of using split modules
- Adding track types without tests for timeline, playback, export/import and migration
- Treating plugins as patches instead of extensions through public contracts
