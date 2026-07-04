import { describe, expect, it } from "vitest"
import {
  assertExternalPluginEntryPoint,
  assertPluginDefinitionMatchesManifest,
  parseExternalPluginManifest,
} from "../pluginManifest"

describe("pluginManifest", () => {
  it("parses a valid external plugin manifest", () => {
    const manifest = parseExternalPluginManifest(
      JSON.stringify({
        id: "test-plugin",
        name: "Test Plugin",
        version: "1.0.0",
        description: "Test plugin",
        author: "MiMIDI",
        entryPoint: "dist/plugin.js",
      }),
      ".mimod",
    )

    expect(manifest.id).toBe("test-plugin")
    expect(manifest.entryPoint).toBe("dist/plugin.js")
  })

  it("rejects manifests without required runtime fields", () => {
    expect(() =>
      parseExternalPluginManifest(
        JSON.stringify({
          id: "broken-plugin",
          name: "Broken Plugin",
        }),
        ".mimod",
      ),
    ).toThrow(".mimod: manifest.json invalido (falta id, name o entryPoint)")
  })

  it("requires the manifest entryPoint to exist in the package", () => {
    const manifest = parseExternalPluginManifest(
      JSON.stringify({
        id: "test-plugin",
        name: "Test Plugin",
        entryPoint: "dist/plugin.js",
      }),
      ".mimod",
    )

    expect(() =>
      assertExternalPluginEntryPoint(manifest, {
        "manifest.json": new Uint8Array(),
      }),
    ).toThrow('.mimod: entryPoint "dist/plugin.js" no encontrado')
  })

  it("rejects plugin definitions without identity fields", () => {
    const manifest = parseExternalPluginManifest(
      JSON.stringify({
        id: "test-plugin",
        name: "Test Plugin",
        entryPoint: "dist/plugin.js",
      }),
      ".mimod",
    )

    expect(() =>
      assertPluginDefinitionMatchesManifest(
        { id: "", name: "" },
        manifest,
        ".mimod",
      ),
    ).toThrow(".mimod: el modulo no exporta un MiMIDIPluginDefinition valido")
  })

  it("rejects plugin definitions with an id different from the manifest", () => {
    const manifest = parseExternalPluginManifest(
      JSON.stringify({
        id: "manifest-plugin",
        name: "Manifest Plugin",
        entryPoint: "dist/plugin.js",
      }),
      ".mimod",
    )

    expect(() =>
      assertPluginDefinitionMatchesManifest(
        { id: "module-plugin", name: "Module Plugin" },
        manifest,
        ".mimod",
      ),
    ).toThrow(
      '.mimod: id del manifest ("manifest-plugin") no coincide con el del modulo ("module-plugin")',
    )
  })
})
