import { useState, useRef, useCallback } from "react"
import {
  generateSamples, samplesToWav, getPreset, PRESETS,
  type SfxParams, type SfxPresetId, type SfxWave,
} from "./sfxrEngine"

type PluginAPI = {
  session: {
    sendOutput(output: {
      type: "audio"; name: string; blob: Blob
      duration: number; destination: "sampler" | "project"
    }): void
  }
  ui: { notify(msg: string): void }
}

const SAMPLE_RATE = 44100

const WAVES: SfxWave[] = ["square", "sawtooth", "triangle", "sine", "noise"]
const WAVE_LABELS: Record<SfxWave, string> = {
  square: "SQ", sawtooth: "SAW", triangle: "TRI", sine: "SIN", noise: "NOISE",
}

const PRESET_IDS = ([...Object.keys(PRESETS), "random"] as SfxPresetId[])
const PRESET_LABELS: Record<SfxPresetId, string> = {
  pickup: "PICKUP", laser: "LASER", explosion: "EXPLOS", powerup: "PWR-UP",
  hit: "HIT", jump: "JUMP", blip: "BLIP", random: "RANDOM",
}

function getSamplesForParams(p: SfxParams) {
  return generateSamples(p, SAMPLE_RATE)
}

export function SfxrWorkspace({ api, version }: { api: PluginAPI; version?: string }) {
  const [params, setParams]           = useState<SfxParams>(() => getPreset("pickup"))
  const [activePreset, setActivePreset] = useState<SfxPresetId>("pickup")
  const [isPlaying, setIsPlaying]     = useState(false)
  const [status, setStatus]           = useState("Listo — elige un preset o ajusta los parámetros")

  const ctxRef = useRef<AudioContext | null>(null)
  const srcRef = useRef<AudioBufferSourceNode | null>(null)

  function set<K extends keyof SfxParams>(key: K, val: SfxParams[K]) {
    setParams(p => ({ ...p, [key]: val }))
    setActivePreset("random")
  }

  function loadPreset(id: SfxPresetId) {
    const p = getPreset(id)
    setParams(p)
    setActivePreset(id)
  }

  function stopCurrent() {
    try { srcRef.current?.stop() } catch { /* already stopped */ }
    srcRef.current = null
    setIsPlaying(false)
  }

  const play = useCallback(async (p: SfxParams) => {
    stopCurrent()
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })
    }
    const ctx = ctxRef.current
    if (ctx.state === "suspended") await ctx.resume()

    const samples = getSamplesForParams(p)
    const buf = ctx.createBuffer(1, samples.length, SAMPLE_RATE)
    buf.getChannelData(0).set(samples)

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.onended = () => setIsPlaying(false)
    src.start()
    srcRef.current = src
    setIsPlaying(true)
  }, [])

  function sendAudio(destination: "project" | "sampler") {
    const samples = getSamplesForParams(params)
    const wav = samplesToWav(samples, SAMPLE_RATE)
    const blob = new Blob([wav], { type: "audio/wav" })
    const duration = samples.length / SAMPLE_RATE
    const ts = new Date()
    const label = PRESET_LABELS[activePreset]
    const name = `SFX ${label} ${ts.toLocaleDateString()} ${ts.toLocaleTimeString()}`
    api.session.sendOutput({ type: "audio", name, blob, duration, destination })
    const dest = destination === "project" ? "proyecto" : "sampler"
    api.ui.notify(`SFX enviado al ${dest}`)
    setStatus(`Enviado al ${dest} → ${name}`)
  }

  const durationMs = Math.round((params.attackTime + params.sustainTime + params.decayTime) * 1000)

  return (
    <div className="sfxr-workspace">

      <div className="sfxr-header">
        <span className="sfxr-title">SFXR // GENERADOR DE EFECTOS</span>
        {version && <span className="sfxr-ver">v{version}</span>}
      </div>

      {/* Presets */}
      <div className="sfxr-presets">
        {PRESET_IDS.map(id => (
          <button
            key={id}
            className={`sfxr-preset-btn${activePreset === id ? " active" : ""}`}
            onClick={() => loadPreset(id)}
            type="button"
          >
            {PRESET_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Selector de onda */}
      <div className="sfxr-wave-row">
        <span className="sfxr-wave-label">ONDA</span>
        <div className="sfxr-wave-group">
          {WAVES.map(w => (
            <button
              key={w}
              className={`sfxr-wave-btn${params.wave === w ? " active" : ""}`}
              onClick={() => set("wave", w)}
              type="button"
            >
              {WAVE_LABELS[w]}
            </button>
          ))}
        </div>
      </div>

      {/* Parámetros */}
      <div className="sfxr-params">
        <ParamRow label="BASE FREQ" display={`${params.baseFreq.toFixed(0)} Hz`}
          min={20} max={2000} step={1} val={params.baseFreq} onChange={v => set("baseFreq", v)} />
        <ParamRow label="SLIDE" display={`${params.freqSlide > 0 ? "+" : ""}${params.freqSlide.toFixed(2)} oct/s`}
          min={-4} max={4} step={0.05} val={params.freqSlide} onChange={v => set("freqSlide", v)} />
        <ParamRow label="ATTACK" display={`${(params.attackTime * 1000).toFixed(0)} ms`}
          min={0} max={0.5} step={0.005} val={params.attackTime} onChange={v => set("attackTime", v)} />
        <ParamRow label="SUSTAIN" display={`${(params.sustainTime * 1000).toFixed(0)} ms`}
          min={0.01} max={1} step={0.01} val={params.sustainTime} onChange={v => set("sustainTime", v)} />
        <ParamRow label="PUNCH" display={`${Math.round(params.sustainPunch * 100)}%`}
          min={0} max={1} step={0.01} val={params.sustainPunch} onChange={v => set("sustainPunch", v)} />
        <ParamRow label="DECAY" display={`${(params.decayTime * 1000).toFixed(0)} ms`}
          min={0.01} max={1} step={0.01} val={params.decayTime} onChange={v => set("decayTime", v)} />
        <ParamRow label="ARPEGIO" display={`×${params.arpeggioFactor.toFixed(2)}`}
          min={0.25} max={4} step={0.05} val={params.arpeggioFactor} onChange={v => set("arpeggioFactor", v)} />
        <ParamRow label="ARP DELAY" display={`${(params.arpeggioDelay * 1000).toFixed(0)} ms`}
          min={0} max={0.5} step={0.005} val={params.arpeggioDelay} onChange={v => set("arpeggioDelay", v)} />
        <ParamRow label="VIB DEPTH" display={`${Math.round(params.vibratoDepth * 100)}%`}
          min={0} max={0.5} step={0.005} val={params.vibratoDepth} onChange={v => set("vibratoDepth", v)} />
        <ParamRow label="VIB SPEED" display={`${params.vibratoSpeed.toFixed(1)} Hz`}
          min={0} max={20} step={0.5} val={params.vibratoSpeed} onChange={v => set("vibratoSpeed", v)} />
      </div>

      {/* Acciones */}
      <div className="sfxr-actions">
        <button
          className={`sfxr-play-btn${isPlaying ? " playing" : ""}`}
          onClick={isPlaying ? stopCurrent : () => void play(params)}
          type="button"
        >
          {isPlaying ? "■  STOP" : `▶  PLAY  (${durationMs} ms)`}
        </button>
        <div className="sfxr-send-row">
          <button className="sfxr-send-btn" onClick={() => sendAudio("project")} type="button">
            ENVIAR AL PROYECTO
          </button>
          <button className="sfxr-send-btn" onClick={() => sendAudio("sampler")} type="button">
            AL SAMPLER
          </button>
        </div>
      </div>

      <div className="sfxr-status">{status}</div>
    </div>
  )
}

function ParamRow({ label, display, min, max, step, val, onChange }: {
  label: string; display: string; min: number; max: number
  step: number; val: number; onChange: (v: number) => void
}) {
  return (
    <div className="sfxr-param-row">
      <span className="sfxr-param-label">{label}</span>
      <input
        className="sfxr-slider"
        max={max}
        min={min}
        step={step}
        type="range"
        value={val}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className="sfxr-param-value">{display}</span>
    </div>
  )
}
