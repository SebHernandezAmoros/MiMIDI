import { useState, useRef, useEffect, useCallback } from "react"

type DroneVoice = {
  osc1: OscillatorNode
  osc2: OscillatorNode
  masterGain: GainNode
  depthGain: GainNode
}

type ClipEntry = { id: string; dbId: string; name: string; blob: Blob; duration: number }
type ClipMeta  = { id: string; dbId: string; name: string; duration: number }

type PluginAPI = {
  transport: { onStop(cb: () => void): () => void }
  session: {
    sendOutput(output: { type: "audio"; name: string; blob: Blob; duration: number; destination: "sampler" | "project"; dbId?: string }): void
    storeClip(blob: Blob, name: string, duration: number): Promise<string>
    loadClip(dbId: string): Promise<Blob | null>
  }
  ui: { notify(message: string): void }
}

const CLIPS_KEY = "atari-punk-session-clips"

function loadClipMetas(): ClipMeta[] {
  try {
    const raw = localStorage.getItem(CLIPS_KEY)
    return raw ? (JSON.parse(raw) as ClipMeta[]) : []
  } catch { return [] }
}

function saveClipMetas(clips: ClipEntry[]) {
  const metas: ClipMeta[] = clips.map(c => ({ id: c.id, dbId: c.dbId, name: c.name, duration: c.duration }))
  try { localStorage.setItem(CLIPS_KEY, JSON.stringify(metas)) } catch {}
}

export function AtariPunkWorkspace({ api, version }: { api: PluginAPI; version?: string }) {
  const [tab, setTab]               = useState<"record" | "clips">("record")
  const [isOn, setIsOn]             = useState(false)
  const [freq, setFreq]             = useState(220)
  const [rate, setRate]             = useState(12)
  const [depth, setDepth]           = useState(80)
  const [isRec, setIsRec]           = useState(false)
  const [recSecs, setRecSecs]       = useState(0)
  const [hasBlob, setHasBlob]       = useState(false)
  const [isPlayingBlob, setIsPlayingBlob] = useState(false)
  const [clips, setClips]           = useState<ClipEntry[]>([])
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)

  const ctxRef         = useRef<AudioContext | null>(null)
  const voiceRef       = useRef<DroneVoice | null>(null)
  const isOnRef        = useRef(false)
  const recRef         = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const blobRef        = useRef<Blob | null>(null)
  const currentClipRef = useRef<ClipEntry | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const recSecsRef     = useRef(0)
  const recDestRef     = useRef<MediaStreamAudioDestinationNode | null>(null)
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef     = useRef<string | null>(null)
  const clipAudioRef   = useRef<HTMLAudioElement | null>(null)
  const clipUrlRef     = useRef<string | null>(null)

  useEffect(() => {
    const metas = loadClipMetas()
    if (metas.length === 0) return
    void Promise.all(
      metas.map(async m => {
        const blob = await api.session.loadClip(m.dbId)
        return blob ? { ...m, blob } : null
      })
    ).then(results => {
      const loaded = results.filter((c): c is ClipEntry => c !== null)
      if (loaded.length > 0) setClips(loaded)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function ensureCtx() {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume()
    return ctxRef.current
  }

  const startDrone = useCallback((f: number, r: number, d: number) => {
    const ctx = ensureCtx()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.02)
    masterGain.connect(ctx.destination)
    if (recDestRef.current) masterGain.connect(recDestRef.current)
    const depthGain = ctx.createGain()
    depthGain.gain.value = d
    const osc1 = ctx.createOscillator()
    osc1.type = "square"; osc1.frequency.value = f; osc1.connect(masterGain)
    const osc2 = ctx.createOscillator()
    osc2.type = "square"; osc2.frequency.value = r
    osc2.connect(depthGain); depthGain.connect(osc1.frequency)
    osc1.start(); osc2.start()
    voiceRef.current = { osc1, osc2, masterGain, depthGain }
  }, [])

  const stopDrone = useCallback(() => {
    const voice = voiceRef.current; const ctx = ctxRef.current
    if (!voice || !ctx) return
    const now = ctx.currentTime
    voice.masterGain.gain.cancelScheduledValues(now)
    voice.masterGain.gain.setValueAtTime(voice.masterGain.gain.value, now)
    voice.masterGain.gain.linearRampToValueAtTime(0, now + 0.04)
    voice.osc1.stop(now + 0.05); voice.osc2.stop(now + 0.05)
    voiceRef.current = null
  }, [])

  function toggleBuzz() {
    const next = !isOnRef.current
    isOnRef.current = next; setIsOn(next)
    if (next) startDrone(freq, rate, depth)
    else { stopDrone(); if (recRef.current?.state === "recording") stopRecording() }
  }

  useEffect(() => {
    const v = voiceRef.current; const ctx = ctxRef.current
    if (!v || !ctx) return
    v.osc1.frequency.setValueAtTime(freq, ctx.currentTime)
  }, [freq])

  useEffect(() => {
    const v = voiceRef.current; const ctx = ctxRef.current
    if (!v || !ctx) return
    v.osc2.frequency.setValueAtTime(rate, ctx.currentTime)
  }, [rate])

  useEffect(() => {
    const v = voiceRef.current; const ctx = ctxRef.current
    if (!v || !ctx) return
    v.depthGain.gain.setValueAtTime(depth, ctx.currentTime)
  }, [depth])

  useEffect(() => {
    return api.transport.onStop(() => {
      if (isOnRef.current) {
        stopDrone(); isOnRef.current = false; setIsOn(false)
        if (recRef.current?.state === "recording") stopRecording()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, stopDrone])

  useEffect(() => {
    return () => {
      stopDrone()
      if (audioRef.current)    { audioRef.current.pause();    audioRef.current = null }
      if (blobUrlRef.current)  { URL.revokeObjectURL(blobUrlRef.current);  blobUrlRef.current = null }
      if (clipAudioRef.current){ clipAudioRef.current.pause(); clipAudioRef.current = null }
      if (clipUrlRef.current)  { URL.revokeObjectURL(clipUrlRef.current);  clipUrlRef.current = null }
      if (timerRef.current)    clearInterval(timerRef.current)
      void ctxRef.current?.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startRecording() {
    const ctx = ensureCtx()
    const dest = ctx.createMediaStreamDestination()
    recDestRef.current = dest
    if (voiceRef.current) voiceRef.current.masterGain.connect(dest)
    const recorder = new MediaRecorder(dest.stream)
    chunksRef.current = []
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      blobRef.current = blob
      setHasBlob(true)
      const _ts = new Date()
      const name = `AtariPunk ${_ts.toLocaleDateString()} ${_ts.toLocaleTimeString()}`
      const duration = recSecsRef.current
      void api.session.storeClip(blob, name, duration).then(dbId => {
        const entry: ClipEntry = { id: dbId, dbId, name, blob, duration }
        currentClipRef.current = entry
        setClips(prev => {
          const updated = [...prev, entry]
          saveClipMetas(updated)
          return updated
        })
      })
    }
    recorder.start()
    recRef.current = recorder
    recSecsRef.current = 0; setRecSecs(0); setIsRec(true)
    timerRef.current = setInterval(() => {
      recSecsRef.current += 1
      setRecSecs(s => s + 1)
    }, 1000)
  }

  function stopRecording() {
    if (recRef.current?.state === "recording") recRef.current.stop()
    recRef.current = null; recDestRef.current = null
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setIsRec(false)
  }

  function toggleRec() {
    if (isRec) stopRecording()
    else { setHasBlob(false); blobRef.current = null; currentClipRef.current = null; stopBlobAudio(); startRecording() }
  }

  function stopBlobAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    setIsPlayingBlob(false)
  }

  function togglePlayBlob() {
    if (isPlayingBlob) { stopBlobAudio(); return }
    if (!blobRef.current) return
    const url = URL.createObjectURL(blobRef.current)
    blobUrlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio
    audio.onended = () => { setIsPlayingBlob(false); URL.revokeObjectURL(url); blobUrlRef.current = null }
    void audio.play(); setIsPlayingBlob(true)
  }

  function downloadBlobAudio() {
    if (!blobRef.current) return
    const url = URL.createObjectURL(blobRef.current)
    const a = document.createElement("a")
    a.href = url; a.download = `AtariPunk-${new Date().toLocaleTimeString()}.webm`; a.click()
    URL.revokeObjectURL(url)
  }

  function sendTo(destination: "sampler" | "project") {
    if (!blobRef.current) return
    const clip = currentClipRef.current
    const name = clip?.name ?? `AtariPunk ${new Date().toLocaleTimeString()}`
    const duration = clip?.duration ?? recSecsRef.current
    api.session.sendOutput({ type: "audio", name, blob: blobRef.current, duration, destination, dbId: clip?.dbId })
    api.ui.notify(destination === "sampler" ? "Enviado al sampler." : "Guardado en proyecto.")
    blobRef.current = null
    setHasBlob(false)
    stopBlobAudio()
    setTab("clips")
  }

  function stopClipAudio() {
    if (clipAudioRef.current) { clipAudioRef.current.pause(); clipAudioRef.current = null }
    if (clipUrlRef.current) { URL.revokeObjectURL(clipUrlRef.current); clipUrlRef.current = null }
    setPlayingClipId(null)
  }

  function toggleClipPlay(clip: ClipEntry) {
    if (playingClipId === clip.id) { stopClipAudio(); return }
    stopClipAudio()
    const url = URL.createObjectURL(clip.blob)
    clipUrlRef.current = url
    const audio = new Audio(url)
    clipAudioRef.current = audio
    audio.onended = () => { setPlayingClipId(null); URL.revokeObjectURL(url); clipUrlRef.current = null }
    void audio.play(); setPlayingClipId(clip.id)
  }

  function downloadClip(clip: ClipEntry) {
    const url = URL.createObjectURL(clip.blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${clip.name}.webm`; a.click()
    URL.revokeObjectURL(url)
  }

  function sendClipTo(clip: ClipEntry, destination: "sampler" | "project") {
    api.session.sendOutput({ type: "audio", name: clip.name, blob: clip.blob, duration: clip.duration, destination, dbId: clip.dbId })
    api.ui.notify(destination === "sampler" ? "Enviado al sampler." : "Guardado en proyecto.")
  }

  function removeClip(id: string) {
    if (playingClipId === id) stopClipAudio()
    setClips(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveClipMetas(updated)
      return updated
    })
  }

  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="atari-workspace">

      {/* ── Header ── */}
      <div className="atari-header">
        <span className="atari-header-title">▌ AtariPunk Console</span>
        <div className="atari-tabs">
          <button type="button" className={`atari-tab${tab === "record" ? " active" : ""}`} onClick={() => setTab("record")}>RECORD</button>
          <button type="button" className={`atari-tab${tab === "clips" ? " active" : ""}`} onClick={() => setTab("clips")}>
            {clips.length > 0 ? `CLIPS (${clips.length})` : "CLIPS"}
          </button>
        </div>
        <span className="atari-header-ver">{version ? `v${version}` : ""}</span>
      </div>

      {tab === "record" ? (
        <>
          {/* ── Params ── */}
          <div className="atari-params">
            <div className="atari-param-row">
              <span className="atari-param-badge">OSC 1</span>
              <span className="atari-param-name">FREQ</span>
              <input type="range" className="atari-slider" min={40} max={1200} step={1} value={freq} onChange={e => setFreq(Number(e.target.value))} />
              <span className="atari-param-value">{freq} Hz</span>
            </div>
            <div className="atari-param-row">
              <span className="atari-param-badge">OSC 2</span>
              <span className="atari-param-name">RATE</span>
              <input type="range" className="atari-slider" min={1} max={60} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))} />
              <span className="atari-param-value">{rate} Hz</span>
            </div>
            <div className="atari-param-row">
              <span className="atari-param-badge" />
              <span className="atari-param-name">DEPTH</span>
              <input type="range" className="atari-slider" min={0} max={300} step={1} value={depth} onChange={e => setDepth(Number(e.target.value))} />
              <span className="atari-param-value">{depth} Hz</span>
            </div>
          </div>

          {/* ── Área principal: BUZZ izquierda + controles derecha ── */}
          <div className="atari-main-area">
            {/* Columna BUZZ (35%) */}
            <div className="atari-buzz-col">
              <button type="button" className={`atari-buzz-btn${isOn ? " on" : ""}`} onClick={toggleBuzz}>
                <span className="atari-buzz-icon">{isOn ? "◼" : "▶"}</span>
                <span className="atari-buzz-label">{isOn ? "BUZZ — ON" : "BUZZ — OFF"}</span>
              </button>
            </div>

            {/* Columna controles (65%) */}
            <div className="atari-ctrl-col">
              {/* Fila 1: REC + timer + PLAY prominente */}
              <div className="atari-top-row">
                <button
                  type="button"
                  className={`atari-rec-btn${isRec ? " recording" : ""}`}
                  onClick={toggleRec}
                  disabled={!isOn && !isRec}
                  title={!isOn && !isRec ? "Activa el BUZZ primero" : undefined}
                >
                  <span className="atari-rec-dot" />
                  {isRec ? "STOP" : "REC"}
                </button>
                <span className={`atari-rec-timer${isRec ? " active" : ""}`}>{fmtSecs(recSecs)}</span>
                {hasBlob && !isRec && (
                  <button type="button" className="atari-play-btn" onClick={togglePlayBlob}>
                    {isPlayingBlob ? "◼ STOP" : "▶ PLAY"}
                  </button>
                )}
              </div>
              {/* Fila 2: acciones secundarias post-grabación */}
              {hasBlob && !isRec && (
                <div className="atari-actions-row">
                  <button type="button" className="atari-action-btn" onClick={downloadBlobAudio}>⬇ SAVE</button>
                  <button type="button" className="atari-action-btn atari-send-btn" onClick={() => sendTo("sampler")}>→ SAMPLER</button>
                  <button type="button" className="atari-action-btn atari-send-btn" onClick={() => sendTo("project")}>→ PROYECTO</button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── Clips tab ── */
        <div className="atari-clips">
          {clips.length === 0 ? (
            <span className="atari-clips-empty">SIN GRABACIONES AÚN</span>
          ) : clips.map((clip, idx) => (
            <div key={clip.dbId ?? idx} className="atari-clip-row">
              <span className="atari-clip-name" title={clip.name}>{clip.name}</span>
              <span className="atari-clip-dur">{fmtSecs(Math.round(clip.duration))}</span>
              <div className="atari-clip-btns">
                <button type="button" className="atari-clip-btn" onClick={() => toggleClipPlay(clip)}>
                  {playingClipId === clip.id ? "◼ STOP" : "▶ PLAY"}
                </button>
                <button type="button" className="atari-clip-btn" onClick={() => downloadClip(clip)}>⬇ SAVE</button>
                <button type="button" className="atari-clip-btn" onClick={() => sendClipTo(clip, "sampler")}>→ SMPLR</button>
                <button type="button" className="atari-clip-btn" onClick={() => sendClipTo(clip, "project")}>→ PROJ</button>
                <button type="button" className="atari-clip-btn atari-clip-btn-del" onClick={() => removeClip(clip.dbId ?? clip.id)}>✕ DEL</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Status bar ── */}
      <div className="atari-status">
        {`> ${isOn ? "BUZZ" : "READY"} | OSC1:${freq}Hz | OSC2:${rate}Hz | DEPTH:${depth}Hz${isRec ? " | ● REC " + fmtSecs(recSecs) : ""}${isPlayingBlob ? " | ▶ PLAYBACK" : ""}${playingClipId ? " | ▶ CLIP" : ""}`}
      </div>
    </div>
  )
}
