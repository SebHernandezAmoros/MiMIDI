# MiMIDI — Plugin Guide

MiMIDI uses a Godot-style plugin model: **the core ships with no plugins built in**. Everything is distributed as `.mimod` files that users install from the Plugins tab.

---

## Plugin types

| Type | Description | Build step |
|------|-------------|------------|
| **A — Instrument pack** | Plain JavaScript, adds mathematical instruments to the core catalog | None |
| **B — React workspace** | TypeScript + React + CSS, full UI panel inside MiMIDI | esbuild |

---

## The `.mimod` format

A `.mimod` file is a renamed ZIP with exactly two entries:

```
my-plugin.mimod (ZIP)
├── manifest.json    ← required metadata
└── index.js         ← single self-contained ESM bundle
```

The host loads `index.js` via dynamic `import()` from a Blob URL, so it must be a **fully self-contained ESM module** — no external dependencies.

### manifest.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "description": "What it does.",
  "author": "Your Name",
  "license": "MIT",
  "entryPoint": "index.js",
  "mimidiVersion": ">=1.0.0",
  "permissions": [],
  "sourceUrl": "https://github.com/your-user/your-repo"
}
```

**ID rules:** must be globally unique, no spaces. Prefix instrument IDs with the plugin name to avoid collisions (`my-plugin/lead-1`).

---

## Type A — Instrument pack

No build step. Write a plain `index.js` and pack it with the provided script.

```js
// index.js
export default {
  id: "my-synth-pack",
  name: "My Synth Pack",
  version: "0.1.0",
  description: "Extra mathematical instruments.",
  enabledByDefault: true,
  instruments: {
    instruments: [
      {
        id: "my-synth-pack/warm-pad",
        name: "Warm Pad",
        category: "base",           // "base" | "advanced"
        waveform: "sine",           // "sine" | "square" | "sawtooth" | "triangle" | "noise"
        volume: 0.3,
        envelope: {
          attack: 0.08,
          decay: 0.2,
          sustain: 0.6,
          release: 0.4
        }
        // optional: lfo, filter, sweep, distortion
      }
    ]
  }
}
```

**Build:**
```bash
node scripts/build-mimod.mjs my-synth-pack
```

The plugin definition lives inline in `scripts/build-mimod.mjs`. Add your entry there.

---

## Type B — React workspace

A full UI component that runs inside MiMIDI's plugin panel.

### File structure

```
public/demo-plugins/my-plugin/
└── src/
    ├── manifest.json
    ├── index.mimod.ts       ← esbuild entry point
    ├── MyWorkspace.tsx      ← React component
    └── my-plugin.css
```

### index.mimod.ts

```typescript
declare const __PLUGIN_CSS__: string   // replaced with CSS content at build time

import { MyWorkspace } from "./MyWorkspace"
import type { MiMIDIPluginDefinition } from "../../pluginModel"

// Inject CSS on load (upsert pattern — safe on hot-reload)
;(function injectCss() {
  if (typeof document === "undefined") return
  let s = document.getElementById("mimidi-my-plugin-css") as HTMLStyleElement | null
  if (!s) { s = document.createElement("style"); s.id = "mimidi-my-plugin-css"; document.head.appendChild(s) }
  s.textContent = __PLUGIN_CSS__
})()

const plugin: MiMIDIPluginDefinition = {
  id: "my-plugin",
  name: "My Plugin",
  version: "0.1.0",
  description: "What it does.",
  enabledByDefault: true,
  workspace: { component: MyWorkspace }
}

export default plugin
```

### MyWorkspace.tsx

```typescript
import { useState, useEffect } from "react"
import type { PluginWorkspaceProps } from "../../pluginModel"

export function MyWorkspace({ api, version }: PluginWorkspaceProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const offPlay  = api.transport.onPlay(() => setIsPlaying(true))
    const offStop  = api.transport.onStop(() => setIsPlaying(false))
    return () => { offPlay(); offStop() }
  }, [api])

  function handlePlay() {
    api.audio.playNote("C4", "my-instrument-id", 0.5)
  }

  function sendToSampler(blob: Blob) {
    api.session.sendOutput({
      type: "audio",
      name: "My recording",
      blob,
      duration: 4,
      destination: "sampler"
    })
    api.ui.notify("Sent to sampler.")
  }

  return (
    <div className="my-plugin-root">
      <button onClick={handlePlay}>Play C4</button>
      <p>BPM: {api.project.getBPM()}</p>
    </div>
  )
}
```

**Build:**
```bash
node scripts/build-plugin.mjs my-plugin
```

Output: `public/demo-plugins/my-plugin/my-plugin.mimod`

---

## Plugin API reference

The `api` object is injected as a prop into every workspace component.

```typescript
type MiMIDIPluginAPI = {
  audio: {
    playNote(note: string, instrumentId: string, duration: number): void
    stopNote(note: string): void
    triggerPad(padId: SmcPadSoundId, velocity?: number): void
  }
  project: {
    getBPM(): number
    getTracks(): { id: string; name: string; type: "melodic" | "percussion" }[]
  }
  transport: {
    readonly isPlaying: boolean
    readonly isRecording: boolean
    readonly bpm: number
    onPlay(cb: () => void): () => void   // returns cleanup function
    onStop(cb: () => void): () => void
  }
  session: {
    sendOutput(output: PluginOutput): void
    storeClip(blob: Blob, name: string, duration: number): Promise<string>
    loadClip(dbId: string): Promise<Blob | null>
  }
  ui: {
    notify(message: string): void
  }
}
```

---

## Why React is injected, not bundled

A plugin cannot `import React from "react"` inside a Blob URL — there is no `node_modules` at that URL. If each plugin bundled its own React, multiple instances would break hooks (React throws if more than one instance exists on the page).

**Solution:** the host sets `globalThis.__MIMIDI_RUNTIME__ = { React }` before the dynamic import. The esbuild config maps `"react"` and `"react/jsx-runtime"` to shim files that read from `globalThis.__MIMIDI_RUNTIME__`.

You write JSX normally — the build handles the rest.

---

## Plugin checklist before publishing

- [ ] `plugin.id` is unique, no spaces
- [ ] `instrument.id` values are unique across all active plugins
- [ ] `enabledByDefault: true` only if the plugin is lightweight and safe by default
- [ ] Bundle uses `globalThis.__MIMIDI_RUNTIME__` — not a bundled copy of React
- [ ] CSS is injected inline (no external file dependencies)
- [ ] Tested with page refresh (IndexedDB persistence)
- [ ] Tested: uninstall → reinstall
- [ ] `sourceUrl` points to the public repository

---

## Known limitations

- **No real-time MIDI input from the timeline** — plugins can send audio to the host but cannot receive live MIDI events from the timeline.
- **No sandbox** — dynamic import has full DOM and browser API access. Only install plugins you trust.
- **No signing** — there is no plugin integrity verification yet.
- **Tool slots not wired** — `piano-toolbar`, `pad-toolbar`, `sampler-panel`, `edit-toolbar` are defined in the model but not connected in the UI yet.

---

---

## AI prompt template

Use this prompt with any AI assistant (Claude, ChatGPT, Gemini, etc.) to generate a new MiMIDI plugin. Copy it, fill in the `[brackets]`, and send it.

---

```
You are going to create a plugin for MiMIDI, a mobile-first music lab built on
mathematical synthesis. Plugins are distributed as .mimod files (renamed ZIPs).

PROJECT CONTEXT
───────────────
- MiMIDI runs in the browser (React 19 + Web Audio API)
- All core sound is mathematical (oscillators, envelopes, no sample banks)
- Plugins are loaded via dynamic import() from a Blob URL
- React is NOT bundled in the plugin — it is injected by the host at runtime via
  globalThis.__MIMIDI_RUNTIME__ = { React }

PLUGIN I WANT
─────────────
Name:        [e.g. "Chord Strummer"]
ID:          [e.g. "chord-strummer"]  ← unique, no spaces
Type:        [A = instrument pack (plain JS, no build) | B = React workspace]
Description: [What it does in one sentence]
Features:    [List the main things it should do]

─────────────────────────────────────────────────────────────────────────────────
PRODUCE THE FOLLOWING FILES
─────────────────────────────────────────────────────────────────────────────────

── FOR TYPE A (instrument pack) ────────────────────────────────────────────────

File 1: manifest.json
{
  "id": "<id>",
  "name": "<name>",
  "version": "0.1.0",
  "description": "<description>",
  "author": "<author>",
  "license": "MIT",
  "entryPoint": "index.js",
  "mimidiVersion": ">=1.0.0",
  "permissions": []
}

File 2: index.js  (plain ESM, no imports)
export default {
  id: "<id>",
  name: "<name>",
  version: "0.1.0",
  description: "<description>",
  enabledByDefault: true,
  instruments: {
    instruments: [
      {
        id: "<id>/<instrument-slug>",
        name: "<instrument name>",
        category: "base" | "advanced",
        waveform: "sine" | "square" | "sawtooth" | "triangle" | "noise",
        volume: 0.0–1.0,
        envelope: { attack, decay, sustain, release }
        // optional: lfo: { rate, depth, target: "frequency"|"gain" }
        // optional: filter: { type, frequency, Q }
        // optional: sweep: { startFreq, endFreq, duration }
        // optional: distortion: { amount }
      }
    ]
  }
}

── FOR TYPE B (React workspace) ────────────────────────────────────────────────

File 1: manifest.json  (same structure as above)

File 2: index.mimod.ts
declare const __PLUGIN_CSS__: string

import { <WorkspaceName> } from "./<WorkspaceName>"
import type { MiMIDIPluginDefinition } from "../../pluginModel"

;(function injectCss() {
  if (typeof document === "undefined") return
  let s = document.getElementById("mimidi-<id>-css") as HTMLStyleElement | null
  if (!s) { s = document.createElement("style"); s.id = "mimidi-<id>-css"; document.head.appendChild(s) }
  s.textContent = __PLUGIN_CSS__
})()

const plugin: MiMIDIPluginDefinition = {
  id: "<id>",
  name: "<name>",
  version: "0.1.0",
  description: "<description>",
  enabledByDefault: true,
  workspace: { component: <WorkspaceName> }
}
export default plugin

File 3: <WorkspaceName>.tsx
// Standard React with hooks. Receives api: MiMIDIPluginAPI as prop.
// Available API:
//   api.audio.playNote(note, instrumentId, duration)
//   api.audio.stopNote(note)
//   api.transport.isPlaying / .bpm
//   api.transport.onPlay(cb) → cleanup fn
//   api.transport.onStop(cb) → cleanup fn
//   api.project.getBPM()
//   api.project.getTracks()
//   api.session.sendOutput({ type:"audio", name, blob, duration, destination:"sampler"|"project" })
//   api.session.storeClip(blob, name, duration) → Promise<string id>
//   api.session.loadClip(id) → Promise<Blob|null>
//   api.ui.notify(message)

import { useState, useEffect, useRef } from "react"
import type { PluginWorkspaceProps } from "../../pluginModel"

export function <WorkspaceName>({ api, version }: PluginWorkspaceProps) {
  // Your component here
}

File 4: <plugin-id>.css
/* Scoped styles for the workspace. Use a root class to avoid leaking. */
.<plugin-id>-root { /* ... */ }

─────────────────────────────────────────────────────────────────────────────────
RULES TO FOLLOW
─────────────────────────────────────────────────────────────────────────────────
1. Never import React directly — it is provided by the host. Write JSX normally.
2. Never bundle external libraries — the plugin must be self-contained.
3. Never import from the MiMIDI app's src/ — only use ../../pluginModel for types.
4. Clean up all event listeners and subscriptions in useEffect return functions.
5. IDs must be unique. Prefix instrument IDs with the plugin ID.
6. Keep CSS scoped to a root class to avoid style leaks.
7. Use only Web Audio API or math for sound — no sample files.

OUTPUT FORMAT
─────────────
Return each file clearly labeled with its filename, then the full file content.
Do not summarize. Do not skip any file. Write complete, working code.
```
