import { generateSamples, getPreset } from "./sfxrEngine"

const SAMPLE_RATE = 44100
let _ctx: AudioContext | null = null

async function getCtx(): Promise<AudioContext> {
  if (!_ctx || _ctx.state === "closed") _ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
  if (_ctx.state === "suspended") await _ctx.resume()
  return _ctx
}

async function fireRandomSfx() {
  const ctx = await getCtx()
  const params = getPreset("random")
  const samples = generateSamples(params, SAMPLE_RATE)
  const buf = ctx.createBuffer(1, samples.length, SAMPLE_RATE)
  buf.getChannelData(0).set(samples)
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  src.start()
}

export function SfxrPadButton(_props: { api: unknown; slotId: string; language: string }) {
  return (
    <button
      className="sfxr-pad-btn"
      onClick={() => void fireRandomSfx()}
      title="Disparar SFX aleatorio"
      type="button"
    >
      ◈ SFX
    </button>
  )
}
