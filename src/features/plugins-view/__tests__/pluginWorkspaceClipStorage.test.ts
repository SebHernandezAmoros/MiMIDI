import { describe, expect, it, vi } from "vitest"
import { createPluginWorkspaceClipStorage } from "../pluginWorkspaceClipStorage"

describe("createPluginWorkspaceClipStorage", () => {
  it("adapts the plugin clip contract to the current blob storage use-case", async () => {
    const blob = new Blob(["clip"], { type: "audio/webm" })
    const storeClip = vi.fn(async () => "plugin-clip-1")
    const storage = createPluginWorkspaceClipStorage({
      loadClip: vi.fn(),
      storeClip,
    })

    await expect(
      storage.storeClip(blob, "Recorded clip", 1.25),
    ).resolves.toBe("plugin-clip-1")
    expect(storeClip).toHaveBeenCalledWith(blob)
  })

  it("loads a persisted clip by dbId and preserves a missing result", async () => {
    const blob = new Blob(["clip"], { type: "audio/webm" })
    const loadClip = vi.fn()
      .mockResolvedValueOnce(blob)
      .mockResolvedValueOnce(null)
    const storage = createPluginWorkspaceClipStorage({
      loadClip,
      storeClip: vi.fn(),
    })

    await expect(storage.loadClip("plugin-clip-1")).resolves.toBe(blob)
    await expect(storage.loadClip("missing-clip")).resolves.toBeNull()
    expect(loadClip).toHaveBeenNthCalledWith(1, "plugin-clip-1")
    expect(loadClip).toHaveBeenNthCalledWith(2, "missing-clip")
  })
})
