import { describe, expect, it, vi } from "vitest"
import type { FileSavePort } from "../../ports/FileSavePort"
import { saveFileWithPort } from "../saveFile"

describe("save file use-case", () => {
  it("saves a file through an injected port", async () => {
    const blob = new Blob(["demo"], { type: "text/plain" })
    const types = [
      {
        accept: { "text/plain": [".txt"] },
        description: "Text",
      },
    ]
    const fileSavePort: FileSavePort = {
      save: vi.fn().mockResolvedValue(undefined),
    }

    await saveFileWithPort(fileSavePort, blob, "demo.txt", types)

    expect(fileSavePort.save).toHaveBeenCalledWith({
      blob,
      suggestedName: "demo.txt",
      types,
    })
  })
})
