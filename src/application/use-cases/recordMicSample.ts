import type { SampleRepository } from "../ports/SampleRepository"
import type { ImportedSampleData } from "./importSampleFile"
import { createLegacySampleUseCaseDependencies } from "./legacySampleUseCaseDependencies"

export type MicRecorderSession = {
  stop: () => Promise<ImportedSampleData>
  cancel: () => void
}

export type FinalizeMicRecordingDependencies = {
  samples: Pick<SampleRepository, "save">
  decodeAudioData(data: ArrayBuffer): Promise<AudioBuffer>
  createSampleId(): string
  now(): Date
}

export async function finalizeMicRecordingWithDependencies(
  dependencies: FinalizeMicRecordingDependencies,
  blob: Blob,
): Promise<ImportedSampleData> {
  const arrayBuffer = await blob.arrayBuffer()
  const audioBuffer = await dependencies.decodeAudioData(arrayBuffer)
  const dbId = dependencies.createSampleId()

  await dependencies.samples.save(dbId, arrayBuffer)

  const recordedAt = dependencies.now()
  const hh = recordedAt.getHours().toString().padStart(2, "0")
  const mm = recordedAt.getMinutes().toString().padStart(2, "0")
  const ss = recordedAt.getSeconds().toString().padStart(2, "0")

  return {
    audioBuffer,
    dbId,
    name: `rec-${hh}${mm}${ss}`,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  }
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

    finalizeMicRecordingWithDependencies(
      createLegacySampleUseCaseDependencies(),
      blob,
    )
      .then(resolve)
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
