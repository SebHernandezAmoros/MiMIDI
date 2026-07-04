import { describe, expect, it, vi } from "vitest"
import { createProjectFeatureNewProjectCommands } from "../projectFeatureNewProjectCommands"

describe("project feature new project commands", () => {
  it("opens and cancels the new project confirmation", () => {
    const setConfirmOpen = vi.fn()
    const commands = createProjectFeatureNewProjectCommands({
      exportBundle: vi.fn(),
      restartProject: vi.fn(),
      setConfirmOpen,
    })

    commands.requestNewProject()
    commands.cancelNewProject()

    expect(setConfirmOpen.mock.calls).toEqual([[true], [false]])
  })

  it("closes the confirmation before restarting without saving", () => {
    const effects: string[] = []
    const commands = createProjectFeatureNewProjectCommands({
      exportBundle: () => {
        effects.push("export")
      },
      restartProject: () => {
        effects.push("restart")
      },
      setConfirmOpen: (open) => {
        effects.push(`open:${open}`)
      },
    })

    commands.continueWithoutSaving()

    expect(effects).toEqual(["open:false", "restart"])
  })

  it("closes, starts the bundle export and restarts when saving first", () => {
    const effects: string[] = []
    const commands = createProjectFeatureNewProjectCommands({
      exportBundle: () => {
        effects.push("export")
      },
      restartProject: () => {
        effects.push("restart")
      },
      setConfirmOpen: (open) => {
        effects.push(`open:${open}`)
      },
    })

    commands.saveAndContinue()

    expect(effects).toEqual(["open:false", "export", "restart"])
  })
})
