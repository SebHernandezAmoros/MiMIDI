# MiMIDI — Wiki

Mobile-first music lab built on mathematical synthesis and a `.mimod` plugin system.

---

## Contents

| # | File | Description |
|---|------|-------------|
| 1 | [01-architecture.md](01-architecture.md) | Layers, principles, and folder structure |
| 2 | [02-plugin-guide.md](02-plugin-guide.md) | How to create plugins — includes an AI prompt template |
| 3 | [03-roadmap.md](03-roadmap.md) | Development phases and current state |

---

## What is MiMIDI?

MiMIDI is a browser-based music laboratory designed primarily for phones and tablets. Its deliberate constraint: **all core sound comes from mathematical synthesis** — oscillators, envelopes, and parameters — not sample banks. This keeps the core lightweight and fast on mobile hardware.

Samples and complex instruments are meant to arrive later as plugins, not as part of the core.

The project follows **Screaming Architecture**: the folder structure talks about music, MIDI, audio, instruments, timeline, transport, and plugins — not about React.

---

## Quick start

```bash
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build
npm test           # run unit tests
```

---

## Plugin system

MiMIDI uses a Godot-style plugin model: **the core ships with no plugins built in**. Everything is distributed as `.mimod` files that users install from the Plugins tab.

Two plugin types:
- **Instrument pack** — plain JavaScript, no build step, adds mathematical instruments
- **React workspace** — TypeScript + React + CSS, full UI panel inside MiMIDI

See [02-plugin-guide.md](02-plugin-guide.md) for the complete guide and an AI prompt template.

---

## Tech stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Audio | Web Audio API |
| Plugin bundler | esbuild |
| Plugin storage | IndexedDB + fflate (ZIP) |
| Tests | Vitest + Testing Library |

---

## Links

- [Main README](../README.md)
- [Internal technical docs](../docs/)
- [GitHub](https://github.com/SebHernandezAmoros/MiMIDI)
