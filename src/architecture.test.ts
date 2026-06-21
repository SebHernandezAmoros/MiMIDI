/// <reference types="node" />

import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const SRC_ROOT = join(process.cwd(), "src")

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const absolutePath = join(dir, entry)
    const stat = statSync(absolutePath)

    if (stat.isDirectory()) {
      return listSourceFiles(absolutePath)
    }

    return /\.(ts|tsx)$/.test(entry) ? [absolutePath] : []
  })
}

function toProjectPath(absolutePath: string): string {
  return relative(process.cwd(), absolutePath).split(sep).join("/")
}

function readProjectFile(projectPath: string): string {
  return readFileSync(join(process.cwd(), projectPath), "utf8")
}

describe("architecture boundaries", () => {
  it("keeps engine-to-app imports limited to documented legacy exceptions", () => {
    const allowed = new Set([
      "src/engine/plugins/pluginModel.ts",
    ])
    const violations = listSourceFiles(join(SRC_ROOT, "engine"))
      .map(toProjectPath)
      .filter((file) => readProjectFile(file).includes("../../app/"))
      .filter((file) => !allowed.has(file))

    expect(violations).toEqual([])
  })

  it("keeps React imports in engine limited to documented legacy exceptions", () => {
    const allowed = new Set([
      "src/engine/plugins/pluginApi.ts",
      "src/engine/plugins/pluginLoader.ts",
      "src/engine/plugins/pluginModel.ts",
      "src/engine/plugins/useExternalPlugins.ts",
    ])
    const violations = listSourceFiles(join(SRC_ROOT, "engine"))
      .map(toProjectPath)
      .filter((file) => /from ["']react["']/.test(readProjectFile(file)))
      .filter((file) => !allowed.has(file))

    expect(violations).toEqual([])
  })

  it("keeps application use-cases independent from React", () => {
    const violations = listSourceFiles(join(SRC_ROOT, "application"))
      .map(toProjectPath)
      .filter((file) => /from ["']react["']/.test(readProjectFile(file)))

    expect(violations).toEqual([])
  })

  it("keeps application storage legacy imports limited to documented migration exceptions", () => {
    const allowed = new Set([
      "src/application/use-cases/legacyProjectUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleUseCaseDependencies.ts",
    ])
    const legacyStorageImport =
      /from ["']\.\.\/\.\.\/engine\/(audio\/(sampleModel|sampleStorage)|project\/projectStorage)["']/
    const violations = listSourceFiles(join(SRC_ROOT, "application", "use-cases"))
      .map(toProjectPath)
      .filter((file) => !file.includes("/__tests__/"))
      .filter((file) => legacyStorageImport.test(readProjectFile(file)))
      .filter((file) => !allowed.has(file))

    expect(violations).toEqual([])
  })

  it("keeps feature storage legacy imports limited to documented migration exceptions", () => {
    const allowed = new Set([
      "src/features/lab/LabApp.tsx",
      "src/features/lab/useLabProject.ts",
    ])
    const legacyStorageImport =
      /from ["']\.\.\/\.\.\/engine\/(audio\/(sampleModel|sampleStorage)|project\/projectStorage)["']/
    const violations = listSourceFiles(join(SRC_ROOT, "features"))
      .map(toProjectPath)
      .filter((file) => !file.includes("/__tests__/"))
      .filter((file) => legacyStorageImport.test(readProjectFile(file)))
      .filter((file) => !allowed.has(file))

    expect(violations).toEqual([])
  })

  it("keeps AppMode settings storage behind repositories", () => {
    const appMode = readProjectFile("src/app/AppMode.tsx")

    expect(appMode).not.toContain("localStorage")
    expect(appMode).not.toContain("mimidi-dark-mode")
    expect(appMode).not.toContain("mimidi-show-key-labels")
    expect(appMode).not.toContain("mimidi-master-volume")
  })

  it("keeps tutorial progress keys behind application use-cases", () => {
    const tutorialStorage = readProjectFile(
      "src/features/tutorial/tutorialStorage.ts",
    )
    const tutorialOverlay = readProjectFile(
      "src/features/tutorial/TutorialOverlay.tsx",
    )

    expect(tutorialStorage).not.toContain("localStorage.getItem")
    expect(tutorialStorage).not.toContain("localStorage.setItem")
    expect(tutorialStorage).not.toContain("mimidi-tutorial-seen")
    expect(tutorialStorage).not.toContain("mimidi-complete-tutorial-seen")
    expect(tutorialOverlay).not.toContain("localStorage.getItem")
    expect(tutorialOverlay).not.toContain("mimidi-dark-mode")
  })

  it("keeps app language storage behind repositories", () => {
    const appI18n = readProjectFile("src/app/appI18n.ts")

    expect(appI18n).not.toContain("localStorage")
    expect(appI18n).not.toContain("mimidi-language")
  })

  it("keeps migrated Lab view preferences behind application use-cases", () => {
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expect(labApp).not.toContain("localStorage.getItem")
    expect(labApp).not.toContain("localStorage.setItem")
    expect(labApp).not.toContain("localStorage.removeItem")
    expect(labApp).not.toContain("mimidi-pad-view-mode")
    expect(labApp).not.toContain("mimidi-piano-view-mode")
    expect(labApp).not.toContain("mimidi-seq-active-steps-track")
    expect(labApp).not.toContain("mimidi-seq-bpm")
    expect(labApp).not.toContain("mimidi-seq-subdivision")
    expect(readProjectFile("src/features/step-sequencer/useMelodicSequencer.ts"))
      .not.toContain("mimidi-seq-steps")
  })

  it("keeps useLabProject project persistence behind application use-cases", () => {
    const useLabProject = readProjectFile("src/features/lab/useLabProject.ts")

    expect(useLabProject).not.toContain("project/projectStorage")
    expect(useLabProject).not.toContain("loadStoredProject")
    expect(useLabProject).not.toContain("saveProject(")
    expect(useLabProject).not.toContain("parseImportedProject")
    expect(useLabProject).not.toContain("JSON.stringify(project")
    expect(useLabProject).not.toContain("exportProjectBundle")
    expect(useLabProject).not.toContain("importProjectBundle(")
    expect(useLabProject).not.toContain("exportProjectAudioUseCase")
    expect(useLabProject).not.toContain("Audio WAV")
    expect(useLabProject).not.toContain("targetType: ProjectTrackType")
    expect(useLabProject).not.toContain("const primaryTrack = (() =>")
    expect(useLabProject).not.toContain(
      "const selectedRecordedNote =\n    primaryTrackNotes.find",
    )
    expect(useLabProject).not.toContain(
      "setActiveTrackId(\n      getMidiTracks(previousProject.timeline)",
    )
    expect(useLabProject).not.toContain(
      "setActiveTrackId(\n      getMidiTracks(nextProject.timeline)",
    )
    expect(useLabProject).not.toContain(
      "setActiveTrackId(getMidiTracks(importedProject.timeline)[0]?.id",
    )
    expect(useLabProject).not.toContain("resolveProjectChangeActiveTrackId")
    expect(useLabProject).not.toContain("formatUndoUnavailableMessage")
    expect(useLabProject).not.toContain("formatUndoAppliedMessage")
    expect(useLabProject).not.toContain("formatRedoUnavailableMessage")
    expect(useLabProject).not.toContain("formatRedoAppliedMessage")
    expect(useLabProject).not.toContain("isLastPercussionTrack")
    expect(useLabProject).not.toContain("isLastMidiTrack = midiTracks.length")
    expect(useLabProject).not.toContain("fallbackTrackId")
    expect(useLabProject).not.toContain("freshPadId")
    expect(useLabProject).not.toContain("appendTrack(currentProject)")
    expect(useLabProject).not.toContain("appendPadTrack(currentProject)")
    expect(useLabProject).not.toContain("appendStepsTrack(currentProject)")
    expect(useLabProject).not.toContain("formatTrackAddedMessage")
    expect(useLabProject).not.toContain("formatStepsTrackRemovedMessage")
    expect(useLabProject).not.toContain("removeTrack(p, trackId)")
    expect(useLabProject).not.toContain("removeNoteFromTrack")
    expect(useLabProject).not.toContain("duplicateNoteInTrack")
    expect(useLabProject).not.toContain("formatTrackRemovedMessage")
    expect(useLabProject).not.toContain("Nota eliminada de")
    expect(useLabProject).not.toContain("Nota duplicada en")
    expect(useLabProject).not.toContain("No hay un commit anterior para esta nota.")
    expect(useLabProject).not.toContain("No se encontro version anterior para esta nota.")
    expect(useLabProject).not.toContain("Nota revertida en")
    expect(useLabProject).not.toContain("Los golpes SMC Pad se pueden mover")
    expect(useLabProject).not.toContain("const safePatch: Partial")
    expect(useLabProject).not.toContain("Math.max(0.01, quantize(patch.duration))")
    expect(useLabProject).not.toContain("Pista agregada:")
    expect(useLabProject).not.toContain("Plugin activado:")
    expect(useLabProject).not.toContain("Plugin desactivado:")
    expect(useLabProject).not.toContain("Pad 1 listo para usar")
    expect(useLabProject).not.toContain("No hay cambios anteriores para deshacer.")
    expect(useLabProject).not.toContain("Deshacer aplicado.")
    expect(useLabProject).not.toContain("No hay cambios posteriores para rehacer.")
    expect(useLabProject).not.toContain("Rehacer aplicado.")
    expect(useLabProject).not.toContain("Notas limpiadas. Pistas y nombre conservados.")
    expect(useLabProject).not.toContain("Proyecto reiniciado desde cero.")
    expect(useLabProject).not.toContain("Proyecto exportado a JSON.")
    expect(useLabProject).not.toContain("Importando proyecto...")
    expect(useLabProject).not.toContain("Proyecto importado:")
    expect(useLabProject).not.toContain("No se pudo importar el JSON del proyecto.")
    expect(useLabProject).not.toContain("No se pudo importar el archivo .mimidi.")
    expect(useLabProject).not.toContain("Empaquetando proyecto...")
    expect(useLabProject).not.toContain("Proyecto guardado como .mimidi")
    expect(useLabProject).not.toContain("No se pudo exportar el bundle.")
    expect(useLabProject).not.toContain("Este navegador no soporta exportacion offline de audio.")
    expect(useLabProject).not.toContain("Audio exportado a WAV")
    expect(useLabProject).not.toContain("No se pudo exportar el audio del proyecto.")
  })
})
