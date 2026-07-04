import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createDefaultProject } from "../../../engine/project/projectModel"
import { useProjectPersistenceSync } from "../useProjectPersistenceSync"

describe("useProjectPersistenceSync", () => {
  it("saves the initial project when the session mounts", () => {
    const project = createDefaultProject()
    const saveProjectSession = vi.fn()

    renderHook(() =>
      useProjectPersistenceSync({
        project,
        saveProjectSession,
      }),
    )

    expect(saveProjectSession).toHaveBeenCalledOnce()
    expect(saveProjectSession).toHaveBeenCalledWith(project)
  })

  it("saves project identity changes without repeating the same project", () => {
    const initialProject = createDefaultProject()
    const editedProject = {
      ...initialProject,
      name: "Proyecto editado",
    }
    const saveProjectSession = vi.fn()
    const { rerender } = renderHook(
      ({ project }) =>
        useProjectPersistenceSync({
          project,
          saveProjectSession,
        }),
      {
        initialProps: {
          project: initialProject,
        },
      },
    )

    rerender({ project: editedProject })
    rerender({ project: editedProject })

    expect(saveProjectSession).toHaveBeenCalledTimes(2)
    expect(saveProjectSession).toHaveBeenNthCalledWith(1, initialProject)
    expect(saveProjectSession).toHaveBeenNthCalledWith(2, editedProject)
  })
})
