# MiMIDI - Wiki

Public documentation for MiMIDI, a browser-based music laboratory built around
mathematical synthesis, MIDI-style events, timeline editing and `.mimod`
plugins.

For detailed internal planning and development memory, see [`docs/`](../docs/).

---

## Contents

| # | File | Description |
|---|---|---|
| 1 | [01-architecture.md](01-architecture.md) | Current architecture, refactor state and boundaries |
| 2 | [02-plugin-guide.md](02-plugin-guide.md) | How to create `.mimod` plugins |
| 3 | [03-roadmap.md](03-roadmap.md) | Current product state and next priorities |

---

## What Is MiMIDI?

MiMIDI is a web music lab for:

- playing notes, chords and arpeggios;
- programming melodic steps and drum beats;
- recording MIDI-style events;
- editing notes and tracks on timelines;
- exporting projects and WAV audio;
- extending the app through plugins.

The main product front is currently the web app. The Expo app in
`apps/mimidi-expo` is a frozen prototype and is not the source of truth for
current behavior.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Useful checks:

```bash
npm run test
npm run test:functional
npm run build
```

---

## Architecture In One Sentence

MiMIDI follows Screaming Architecture: the codebase should be organized around
music, audio, MIDI, project, tracks, timeline, sampler and plugins rather than
generic framework folders.

The current refactor split a lot of previously centralized behavior into:

- `domain/` for pure project/plugin/MIDI rules;
- `application/` for use-cases and ports;
- `infrastructure/` for browser adapters;
- `features/project-session/` for shared project session state;
- `plugin-host/` for React plugin runtime contracts;
- compatibility facades in `LabApp`, `projectModel`, `audioEngine` and plugin
  engine files.

---

## Plugin System

MiMIDI plugins are distributed as `.mimod` files, which are ZIP files containing
`manifest.json` and a bundled `index.js`.

Two common plugin shapes:

- instrument packs: add mathematical instruments;
- React workspaces: add a full UI panel inside MiMIDI.

See [02-plugin-guide.md](02-plugin-guide.md).

---

## Tech Stack

| Area | Tool |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Audio | Web Audio API |
| Plugins | esbuild + fflate + IndexedDB |
| Tests | Vitest, Testing Library, Puppeteer |
| PWA | vite-plugin-pwa |

---

## Links

- [Main README](../README.md)
- [Internal technical docs](../docs/00-README-DOCS.md)
- [Architecture refactor plan](../docs/planes/2026-06-19-plan-desacoplamiento-y-estabilizacion-arquitectura.md)
