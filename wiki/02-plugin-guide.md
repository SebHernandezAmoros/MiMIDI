# MiMIDI - Plugin Guide

MiMIDI plugins are distributed as `.mimod` files. A `.mimod` is a ZIP file with
metadata and a bundled JavaScript module that the host loads at runtime.

Plugins can add mathematical instruments, provide a React workspace, or send
MIDI/audio output back into the host project.

---

## Plugin Types

| Type | Description | Build |
|---|---|---|
| Instrument pack | Plain ESM plugin that contributes mathematical instruments | `npm run plugin:pack <id>` |
| React workspace | TypeScript/React/CSS workspace bundled for MiMIDI | `npm run plugin:build <id>` |

Demo plugins live in `public/demo-plugins/`:

| Plugin | Kind |
|---|---|
| `motion-synth-pack` | Instrument pack |
| `ataripunk` | React workspace |
| `sfxr` | React workspace |

---

## `.mimod` Format

```text
my-plugin.mimod
+-- manifest.json
+-- index.js
```

`index.js` must be a self-contained ESM bundle. The host imports it dynamically
from a Blob URL.

### `manifest.json`

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

Rules:

- `id` must be globally unique and use kebab-case;
- `version` in `manifest.json` and in the exported plugin definition must match;
- instrument IDs should be unique across all active plugins.

---

## Instrument Pack

Instrument packs are the simplest plugins. They export a plugin definition with
an `instruments` contribution.

```js
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
        category: "base",
        waveform: "triangle",
        volume: 0.25,
        envelope: {
          attack: 0.08,
          decay: 0.2,
          sustain: 0.6,
          release: 0.4
        }
      }
    ]
  }
}
```

Build:

```bash
npm run plugin:pack my-synth-pack
```

The current helper script packs known demo plugin definitions from
`scripts/build-mimod.mjs`.

---

## React Workspace Plugin

React workspace plugins use TypeScript, React and CSS, but React itself is not
bundled. The host exposes its own React runtime through:

```js
globalThis.__MIMIDI_RUNTIME__.React
```

Typical source layout:

```text
public/demo-plugins/my-plugin/
+-- src/
    +-- manifest.json
    +-- index.mimod.ts
    +-- MyWorkspace.tsx
    +-- my-plugin.css
```

### `index.mimod.ts`

```typescript
declare const __PLUGIN_CSS__: string

import { MyWorkspace } from "./MyWorkspace"
import type { MiMIDIPluginDefinition } from "../../pluginModel"

;(function injectCss() {
  if (typeof document === "undefined") return
  let style = document.getElementById("mimidi-my-plugin-css") as HTMLStyleElement | null
  if (!style) {
    style = document.createElement("style")
    style.id = "mimidi-my-plugin-css"
    document.head.appendChild(style)
  }
  style.textContent = __PLUGIN_CSS__
})()

const plugin: MiMIDIPluginDefinition = {
  id: "my-plugin",
  name: "My Plugin",
  version: "0.1.0",
  description: "What it does.",
  enabledByDefault: true,
  workspace: { component: MyWorkspace },
}

export default plugin
```

### `MyWorkspace.tsx`

```typescript
import { useEffect, useState } from "react"
import type { PluginWorkspaceProps } from "../../pluginModel"

export function MyWorkspace({ api, version }: PluginWorkspaceProps) {
  const [playing, setPlaying] = useState(api.transport.isPlaying)

  useEffect(() => {
    const offPlay = api.transport.onPlay(() => setPlaying(true))
    const offStop = api.transport.onStop(() => setPlaying(false))
    return () => {
      offPlay()
      offStop()
    }
  }, [api])

  return (
    <div className="my-plugin-root">
      <button onClick={() => api.audio.playNote("C4", "pure-sine", 0.5)}>
        Play C4
      </button>
      <p>BPM: {api.project.getBPM()}</p>
      <p>Status: {playing ? "playing" : "stopped"}</p>
      <p>Version: {version}</p>
    </div>
  )
}
```

Build:

```bash
npm run plugin:build my-plugin
```

---

## Plugin API

Workspace components receive `api` as a prop.

```typescript
type MiMIDIPluginAPI = {
  audio: {
    playNote(note: string, instrumentId: string, duration: number): void
    stopNote(note: string): void
    triggerPad(padId: string, velocity?: number): void
  }
  project: {
    getBPM(): number
    getTracks(): { id: string; name: string; type: string }[]
  }
  transport: {
    readonly isPlaying: boolean
    readonly isRecording: boolean
    readonly bpm: number
    onPlay(cb: () => void): () => void
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

Audio output can target the sampler or the project:

```typescript
api.session.sendOutput({
  type: "audio",
  name: "Take 1",
  blob,
  duration: 4.2,
  destination: "project",
})
```

If a plugin has already stored a clip with `storeClip`, it can pass the returned
`dbId` in audio output to avoid duplicate storage.

---

## Public SDK Types

The public declarations are available at:

```text
public/mimidi-plugin-sdk.d.ts
```

The demo plugin source uses local compatibility imports such as
`../../pluginModel` because the build script provides a plugin-authoring
environment. External authors should use the published/downloaded SDK types when
building outside this repository.

---

## React Runtime Rule

Do not bundle React into a plugin. MiMIDI maps React imports to shims during the
plugin build:

- `scripts/react-shim.js`
- `scripts/react-jsx-runtime-shim.js`

This avoids multiple React instances and keeps hooks working.

---

## Security Model

Plugins are JavaScript loaded into the same page origin. There is no iframe or
worker sandbox in the current version.

Only install plugins from sources you trust.

Known limitations:

- no plugin signing yet;
- no sandbox yet;
- no real-time MIDI input stream from the timeline into plugins yet;
- tool slot support exists in contracts/host areas but should be considered an
  evolving surface.

---

## Publishing Checklist

- [ ] `plugin.id` is unique and uses kebab-case
- [ ] `version` matches in manifest and plugin export
- [ ] instrument IDs are unique
- [ ] React is injected by the host, not bundled
- [ ] CSS is injected inline
- [ ] subscriptions and event listeners are cleaned up
- [ ] install, refresh, uninstall and reinstall are tested
- [ ] `sourceUrl` points to a public repo, if available

---

## AI Prompt Template

```text
Create a MiMIDI .mimod plugin.

Plugin ID: [kebab-case-id]
Plugin name: [Name]
Type: [instrument pack | React workspace]
Description: [one sentence]
Main behavior: [what it should do]

Rules:
- Output a .mimod-compatible plugin with manifest.json and index.js.
- For React workspace plugins, source files live under
  public/demo-plugins/<id>/src/.
- React must not be bundled; it is provided by MiMIDI through
  globalThis.__MIMIDI_RUNTIME__.React.
- CSS must be injected inline from index.mimod.ts using __PLUGIN_CSS__.
- The plugin export default must include id, name, version, description and
  enabledByDefault.
- If it contributes instruments, keep all sound mathematical.
- If it sends audio to MiMIDI, use api.session.sendOutput.
- Clean up all subscriptions in React effects.

Generate all required files with complete code.
```
