import { describe, expect, it, vi } from "vitest"
import type { FileSavePort } from "../../ports/FileSavePort"
import { saveSeqMixWavWithPort } from "../exportSeqMix"

describe("export sequencer mix use-case", () => {
  it("saves a rendered WAV through an injected file save port", async () => {
    const wav = new ArrayBuffer(4)
    const fileSavePort: FileSavePort = {
      save: vi.fn().mockResolvedValue(undefined),
    }

    await saveSeqMixWavWithPort(fileSavePort, wav, "Beat")

    expect(fileSavePort.save).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      suggestedName: "Beat.wav",
      types: [
        {
          accept: { "audio/wav": [".wav"] },
          description: "Audio WAV",
        },
      ],
    })
    const request = vi.mocked(fileSavePort.save).mock.calls[0]?.[0]
    expect(request?.blob.type).toBe("audio/wav")
  })
})
