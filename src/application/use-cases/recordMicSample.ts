import { decodeAudioData } from "../../engine/audio/audioEngine"
import { saveSampleBuffer } from "../../engine/audio/sampleStorage"
import type { ImportedSampleData } from "./importSampleFile"

export type MicRecorderSession = {
  stop: () => Promise<ImportedSampleData>
  cancel: () => void
}

export async function startMicRecording(): Promise<MicRecorderSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)
  const chunks: Blob[] = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  let cancelled = false
  let stopped = false
  let stopResolve: ((data: ImportedSampleData) => void) | null = null
  let stopReject: ((err: unknown) => void) | null = null

  const cleanup = () => stream.getTracks().forEach((t) => t.stop())

  recorder.onstop = () => {
    cleanup()
    if (cancelled || !stopResolve || !stopReject) return
    const resolve = stopResolve
    const reject = stopReject
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
    blob
      .arrayBuffer()
      .then((arrayBuffer) => decodeAudioData(arrayBuffer).then((audioBuffer) => ({ arrayBuffer, audioBuffer })))
      .then(async ({ arrayBuffer, audioBuffer }) => {
        const dbId = `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`
        await saveSampleBuffer(dbId, arrayBuffer)
        const now = new Date()
        const hh = now.getHours().toString().padStart(2, "0")
        const mm = now.getMinutes().toString().padStart(2, "0")
        const ss = now.getSeconds().toString().padStart(2, "0")
        resolve({
          audioBuffer,
          dbId,
          name: `rec-${hh}${mm}${ss}`,
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
        })
      })
      .catch(reject)
  }

  recorder.start()

  return {
    stop: () =>
      new Promise<ImportedSampleData>((resolve, reject) => {
        if (stopped) {
          reject(new Error("already stopped"))
          return
        }
        stopped = true
        stopResolve = resolve
        stopReject = reject
        if (recorder.state !== "inactive") recorder.stop()
      }),
    cancel: () => {
      cancelled = true
      if (recorder.state !== "inactive") recorder.stop()
      else cleanup()
    },
  }
}
