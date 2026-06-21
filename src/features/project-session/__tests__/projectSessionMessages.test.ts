import { describe, expect, it } from "vitest"
import {
  formatAudioExportFailedMessage,
  formatAudioExportedMessage,
  formatBundleExportFailedMessage,
  formatBundleExportedMessage,
  formatBundlePackagingMessage,
  formatJsonExportedMessage,
  formatJsonImportFailedMessage,
  formatOfflineAudioUnsupportedMessage,
  formatPluginEnabledMessage,
  formatProjectImportedMessage,
  formatProjectImportingMessage,
  formatRedoAppliedMessage,
  formatRedoUnavailableMessage,
  formatSessionClearedMessage,
  formatTrackAddedMessage,
  formatTrackRemovedMessage,
  formatStepsTrackRemovedMessage,
  formatUndoAppliedMessage,
  formatUndoUnavailableMessage,
  formatProjectRestartedMessage,
  formatBundleImportFailedMessage,
} from "../projectSessionMessages"

describe("project session messages", () => {
  it("formats track added messages", () => {
    expect(formatTrackAddedMessage("Pad 1")).toBe("Pista agregada: Pad 1.")
  })

  it("formats steps track removal messages", () => {
    expect(formatStepsTrackRemovedMessage("Steps 1")).toBe(
      "Pista eliminada: Steps 1.",
    )
  })

  it("formats regular track removal messages", () => {
    expect(
      formatTrackRemovedMessage({
        isLastMidiTrack: false,
        isLastPercussionTrack: false,
        trackName: "Lead",
      }),
    ).toBe("Pista eliminada: Lead.")
  })

  it("formats last percussion track removal messages", () => {
    expect(
      formatTrackRemovedMessage({
        isLastMidiTrack: false,
        isLastPercussionTrack: true,
        trackName: "Pad 1",
      }),
    ).toBe("Pad 1 eliminada. Pad 1 listo para usar.")
  })

  it("formats last midi track removal messages", () => {
    expect(
      formatTrackRemovedMessage({
        isLastMidiTrack: true,
        isLastPercussionTrack: false,
        trackName: "Lead",
      }),
    ).toBe("Lead eliminada. Pista vacia lista para grabar.")
  })

  it("formats plugin status messages", () => {
    expect(formatPluginEnabledMessage("Reverb Lab", true)).toBe(
      "Plugin activado: Reverb Lab.",
    )
    expect(formatPluginEnabledMessage("Reverb Lab", false)).toBe(
      "Plugin desactivado: Reverb Lab.",
    )
  })

  it("formats undo and redo messages", () => {
    expect(formatUndoUnavailableMessage()).toBe(
      "No hay cambios anteriores para deshacer.",
    )
    expect(formatUndoAppliedMessage()).toBe("Deshacer aplicado.")
    expect(formatRedoUnavailableMessage()).toBe(
      "No hay cambios posteriores para rehacer.",
    )
    expect(formatRedoAppliedMessage()).toBe("Rehacer aplicado.")
  })

  it("formats session lifecycle messages", () => {
    expect(formatSessionClearedMessage()).toBe(
      "Notas limpiadas. Pistas y nombre conservados.",
    )
    expect(formatProjectRestartedMessage()).toBe(
      "Proyecto reiniciado desde cero.",
    )
  })

  it("formats project import and export messages", () => {
    expect(formatJsonExportedMessage()).toBe("Proyecto exportado a JSON.")
    expect(formatProjectImportingMessage()).toBe("Importando proyecto...")
    expect(formatProjectImportedMessage("Demo Song")).toBe(
      "Proyecto importado: Demo Song.",
    )
    expect(formatJsonImportFailedMessage()).toBe(
      "No se pudo importar el JSON del proyecto.",
    )
    expect(formatBundleImportFailedMessage()).toBe(
      "No se pudo importar el archivo .mimidi.",
    )
  })

  it("formats bundle export messages", () => {
    expect(formatBundlePackagingMessage()).toBe("Empaquetando proyecto...")
    expect(formatBundleExportedMessage()).toBe(
      "Proyecto guardado como .mimidi (incluye muestras).",
    )
    expect(formatBundleExportFailedMessage()).toBe(
      "No se pudo exportar el bundle.",
    )
  })

  it("formats audio export messages", () => {
    expect(formatOfflineAudioUnsupportedMessage()).toBe(
      "Este navegador no soporta exportacion offline de audio.",
    )
    expect(formatAudioExportedMessage(1.234)).toBe(
      "Audio exportado a WAV (1.23s).",
    )
    expect(formatAudioExportFailedMessage()).toBe(
      "No se pudo exportar el audio del proyecto.",
    )
  })
})
