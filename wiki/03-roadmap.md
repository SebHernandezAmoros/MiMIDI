# MiMIDI — Roadmap

## Development philosophy

> Funciona → Separar → Refinar → Expandir

MiMIDI grows in layers: get something working, separate concerns, refine quality, then expand surface. No premature abstraction, no skipping phases.

---

## Foundation phases (completed)

| Phase | Name | Status |
|-------|------|--------|
| 1 | Audio core | ✅ Complete |
| 2 | Note system | ✅ Complete |
| 3 | Piano | ✅ Complete |
| 4 | Basic MIDI | ✅ Complete |
| 5 | Timeline | ✅ Complete |
| 6 | Plugin system | ✅ MVP complete |
| 7 | Advanced synthesis | ✅ MVP complete |
| 8 | Musical project & persistence | ✅ Complete |

---

## What works today (May 2026)

- Multi-track recording with MIDI events
- Mathematical instruments with ADSR, LFO, filters, distortion, pan
- Piano roll timeline — move, resize, snap, undo/redo (`Ctrl+Z` / `Ctrl+Y`)
- WAV PCM 32-bit float export via `OfflineAudioContext`
- Import / export project as JSON
- Local persistence via IndexedDB
- SMC Pad — 8 synthetic percussion sounds with velocity
- Arpeggiator — Up, Down, Up/Down, Random, Chord modes
- Track timeline with per-track time offset
- Plugin system — install `.mimod` files, persists across sessions
- App mode with separate views: Edit, Project, Perform, Lab, Sampler, Settings

### Demo plugins shipped
| Plugin | Type |
|--------|------|
| Motion Synth Pack | Instrument pack |
| AtariPunk Synth | React workspace |
| SFXR Generator | React workspace |

---

## What's next

### Step 1 — Become a real application
The current state is a functional lab. The next step is turning it into a polished, navigable app with a clear identity.

- Consolidate the web app as the primary product front
- Clean navigation between all views (Perform, Edit, Lab, Sampler, Settings)
- Visual hierarchy, spacing, density — consistent across all screens
- Responsive layout faithful to the mobile-first design

### Step 2 — Dedicated desktop web environment
A separate, optimized experience for larger screens (laptop / desktop browser).

- Layout adapted for wider viewports — sidebars, panels, more information density
- Keyboard shortcuts fully documented and accessible
- Desktop-specific UX where it makes sense (hover states, drag handles, etc.)

### Step 3 — Windows installable (PWA)
Make MiMIDI installable on Windows as a Progressive Web App — no Electron needed.

- `manifest.json` with app metadata and icons
- Service worker for offline support
- Installable from Chrome/Edge via the native "Install app" prompt

### Step 4 — Community patches and improvements
Open the project to external contributions.

- Defined areas where contributions are welcome: plugins, translations, instruments, UI fixes
- Review and merge community-submitted `.mimod` plugins

---

## Plugin roadmap

Demo plugins already shipped: **Motion Synth Pack**, **AtariPunk Synth**, **SFXR Generator**.

These are planned or in the backlog — community contributions welcome:

| Plugin | Description |
|--------|-------------|
| **Wave Designer** | Visual waveform editor — draw a custom waveform and use it as an oscillator |
| **Bitcrusher** | Bit depth and sample rate reduction for lo-fi / 8-bit textures |
| **Pattern Generator** | Procedural MIDI pattern creator — generative sequences and rhythms |
| **Oscillator** | Standalone oscillator workspace with real-time waveform visualization |
| **Circuit Bending** | Experimental sound mangler inspired by circuit-bent hardware |
| **Cassette** | Animated cassette player — works with the screen off, tape-style audio |
| **Sample Library** | Minimal reference plugin for loading a custom sampled instrument |
| **Vertical Mode** | Alternative layout optimized for tall phone screens |

---

## Anti-patterns we avoid

- No sample banks in the core (samples belong in plugins)
- No synthesis logic inside React components
- No generic `utils/` or `services/` folders — everything has a musical domain name
- No over-engineering before the feature is validated
