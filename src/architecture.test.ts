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
    const allowed = new Set<string>()
    const violations = listSourceFiles(join(SRC_ROOT, "engine"))
      .map(toProjectPath)
      .filter((file) => readProjectFile(file).includes("../../app/"))
      .filter((file) => !allowed.has(file))

    expect(violations).toEqual([])
  })

  it("keeps React imports in engine limited to documented legacy exceptions", () => {
    const allowed = new Set<string>()
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

  it("keeps public audio contracts in audioTypes behind the audioEngine facade", () => {
    const audioTypes = readProjectFile("src/engine/audio/audioTypes.ts")
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")

    expect(audioTypes).toContain("export type ADSREnvelope")
    expect(audioTypes).toContain("export type AudioCalibration")
    expect(audioTypes).toContain("export type SamplePlayback")
    expect(audioEngine).toContain('export type {')
    expect(audioEngine).toContain('from "./audioTypes"')
    expect(audioEngine).not.toContain("export type ADSREnvelope =")
    expect(audioEngine).not.toContain("export type AudioCalibration =")
  })

  it("keeps AudioContext lifecycle behind audioContextManager", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const contextManager = readProjectFile(
      "src/engine/audio/audioContextManager.ts",
    )

    expect(audioEngine).toContain(
      'import { getAudioContext } from "./audioContextManager"',
    )
    expect(audioEngine).toContain('from "./audioContextManager"')
    expect(audioEngine).not.toContain("new AudioContext()")
    expect(audioEngine).not.toContain("let audioContext:")
    expect(audioEngine).not.toContain("resumePromise")
    expect(contextManager).toContain("createAudioContextManager")
    expect(contextManager).toContain("createAudioContext: () => new AudioContext()")
  })

  it("keeps master gain lifecycle behind masterOutput", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const masterOutput = readProjectFile("src/engine/audio/masterOutput.ts")

    expect(audioEngine).toContain(
      'import { getMasterGainNode } from "./masterOutput"',
    )
    expect(audioEngine).toContain(
      'export { setMasterVolume } from "./masterOutput"',
    )
    expect(audioEngine).not.toContain("let masterGainNode:")
    expect(audioEngine).not.toContain("export function setMasterVolume")
    expect(masterOutput).toContain("createMasterOutput")
    expect(masterOutput).toContain("masterGainNode.gain.setValueAtTime(0.8")
  })

  it("keeps voice distortion and filter construction behind fxChain", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const fxChain = readProjectFile("src/engine/audio/fxChain.ts")

    expect(audioEngine).toContain(
      'import { createVoiceFxChain } from "./fxChain"',
    )
    expect(audioEngine).not.toContain("makeDistortionCurve")
    expect(audioEngine).not.toContain("createWaveShaper()")
    expect(audioEngine).not.toContain("createBiquadFilter()")
    expect(fxChain).toContain("createVoiceFxChain")
    expect(fxChain).toContain('shaper.oversample = "2x"')
  })

  it("keeps ADSR and active voice lifecycle behind synthVoiceEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const synthVoiceEngine = readProjectFile(
      "src/engine/audio/synthVoiceEngine.ts",
    )

    expect(audioEngine).toContain('from "./synthVoiceEngine"')
    expect(audioEngine).not.toContain("type ActiveVoice")
    expect(audioEngine).not.toContain("DEFAULT_ENVELOPE")
    expect(audioEngine).not.toContain("activeVoices")
    expect(audioEngine).not.toContain("voiceCounter")
    expect(audioEngine).not.toContain("function scheduleVoiceStart")
    expect(audioEngine).not.toContain("function registerActiveVoice")
    expect(synthVoiceEngine).toContain("createSynthVoiceEngine")
    expect(synthVoiceEngine).toContain(
      "const activeVoices = new Map<VoiceId, ActiveVoice>()",
    )
  })

  it("keeps online voice LFO construction behind lfoEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const lfoEngine = readProjectFile("src/engine/audio/lfoEngine.ts")

    expect(audioEngine).toContain(
      'import { createVoiceLfo } from "./lfoEngine"',
    )
    expect(audioEngine).not.toContain("function createFrequencyLfo")
    expect(audioEngine).not.toContain("function createGainLfo")
    expect(audioEngine).not.toContain("lfoSource.frequency.setValueAtTime")
    expect(audioEngine).not.toContain("lfoGainNode.gain.setValueAtTime")
    expect(lfoEngine).toContain("export function createVoiceLfo")
    expect(lfoEngine).toContain('lfo.waveform ?? "sine"')
  })

  it("keeps online oscillator and frequency sweep behind oscillatorEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const oscillatorEngine = readProjectFile(
      "src/engine/audio/oscillatorEngine.ts",
    )

    expect(audioEngine).toContain(
      'import { createVoiceOscillator } from "./oscillatorEngine"',
    )
    expect(audioEngine).not.toContain(
      'oscillator.type = options.waveform ?? "sine"',
    )
    expect(audioEngine).not.toContain(
      "oscillator.frequency.exponentialRampToValueAtTime",
    )
    expect(oscillatorEngine).toContain(
      "export function createVoiceOscillator",
    )
    expect(oscillatorEngine).toContain(
      "Math.max(options.sweep.to, 1)",
    )
  })

  it("keeps online white-noise generation behind noiseEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const noiseEngine = readProjectFile("src/engine/audio/noiseEngine.ts")

    expect(audioEngine).toContain(
      'import { createLoopingNoiseSource } from "./noiseEngine"',
    )
    expect(audioEngine).not.toContain("let whiteNoiseBuffer")
    expect(audioEngine).not.toContain("function getWhiteNoiseBuffer")
    expect(audioEngine).not.toContain("Math.random() * 2 - 1")
    expect(noiseEngine).toContain("export function createNoiseEngine")
    expect(noiseEngine).toContain(
      "const bufferSize = context.sampleRate * 2",
    )
  })

  it("keeps online sample calibration behind sampleCalibration", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const sampleCalibration = readProjectFile(
      "src/engine/audio/sampleCalibration.ts",
    )
    const samplePlaybackEngine = readProjectFile(
      "src/engine/audio/samplePlaybackEngine.ts",
    )

    expect(samplePlaybackEngine).toContain(
      'import { resolveSampleCalibration } from "./sampleCalibration"',
    )
    expect(audioEngine).not.toContain("./sampleCalibration")
    expect(audioEngine).not.toContain("clamp(cal.trimStart")
    expect(audioEngine).not.toContain("clamp(cal.trimEnd")
    expect(audioEngine).not.toContain("Math.pow(2, cal.tune / 12)")
    expect(audioEngine).not.toContain("clamp(cal.fadeIn")
    expect(audioEngine).not.toContain("clamp(cal.fadeOut")
    expect(sampleCalibration).toContain(
      "export function resolveSampleCalibration",
    )
    expect(sampleCalibration).toContain(
      "const realDuration = bufferDuration / playbackRate",
    )
  })

  it("keeps simple sample playback behind samplePlaybackEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const samplePlaybackEngine = readProjectFile(
      "src/engine/audio/samplePlaybackEngine.ts",
    )
    const immediateStart = audioEngine.indexOf(
      "export function playAudioBuffer(",
    )
    const scheduledStart = audioEngine.indexOf(
      "export function scheduleAudioBuffer(",
      immediateStart,
    )
    const calibratedStart = audioEngine.indexOf(
      "export function playAudioBufferCalibrated(",
      scheduledStart,
    )
    const immediateFacade = audioEngine.slice(immediateStart, scheduledStart)
    const scheduledFacade = audioEngine.slice(scheduledStart, calibratedStart)

    expect(audioEngine).toContain("playSimpleSample,")
    expect(audioEngine).toContain("scheduleSimpleSample,")
    expect(immediateFacade).toContain("return playSimpleSample(")
    expect(scheduledFacade).toContain("return scheduleSimpleSample(")
    expect(immediateFacade).not.toContain("createBufferSource")
    expect(scheduledFacade).not.toContain("createBufferSource")
    expect(samplePlaybackEngine).toContain(
      "export function playSimpleSample",
    )
    expect(samplePlaybackEngine).toContain(
      "export function scheduleSimpleSample",
    )
  })

  it("keeps calibrated looping playback behind samplePlaybackEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const samplePlaybackEngine = readProjectFile(
      "src/engine/audio/samplePlaybackEngine.ts",
    )
    const facadeStart = audioEngine.indexOf(
      "export function playAudioBufferLooping(",
    )
    const facadeEnd = audioEngine.indexOf(
      "export function playAudioBufferCalibratedAt(",
      facadeStart,
    )
    const facade = audioEngine.slice(facadeStart, facadeEnd)

    expect(audioEngine).toContain("scheduleLoopingSample,")
    expect(facade).toContain("return scheduleLoopingSample(")
    expect(facade).not.toContain("createStereoPanner")
    expect(facade).not.toContain("createBufferSource")
    expect(facade).not.toContain("source.loop")
    expect(facade).not.toContain("source.onended")
    expect(samplePlaybackEngine).toContain(
      "export function scheduleLoopingSample",
    )
  })

  it("keeps calibrated one-shot playback behind samplePlaybackEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const samplePlaybackEngine = readProjectFile(
      "src/engine/audio/samplePlaybackEngine.ts",
    )
    const facadeStart = audioEngine.indexOf(
      "export function playAudioBufferCalibrated(",
    )
    const facadeEnd = audioEngine.indexOf(
      "export function startFrequency(",
      facadeStart,
    )
    const facade = audioEngine.slice(facadeStart, facadeEnd)

    expect(audioEngine).toContain("playCalibratedSample,")
    expect(audioEngine).toContain('from "./samplePlaybackEngine"')
    expect(facade).toContain("return playCalibratedSample(")
    expect(facade).not.toContain("createStereoPanner")
    expect(facade).not.toContain("createBufferSource")
    expect(facade).not.toContain("realDurationMs:")
    expect(samplePlaybackEngine).toContain(
      "export function playCalibratedSample",
    )
  })

  it("keeps scheduled calibrated playback behind samplePlaybackEngine", () => {
    const audioEngine = readProjectFile("src/engine/audio/audioEngine.ts")
    const samplePlaybackEngine = readProjectFile(
      "src/engine/audio/samplePlaybackEngine.ts",
    )
    const facadeStart = audioEngine.indexOf(
      "export function playAudioBufferCalibratedAt(",
    )
    const facade = audioEngine.slice(facadeStart)

    expect(audioEngine).toContain("scheduleCalibratedSample,")
    expect(facade).toContain("return scheduleCalibratedSample(")
    expect(facade).not.toContain("createStereoPanner")
    expect(facade).not.toContain("createBufferSource")
    expect(facade).not.toContain("source.onended")
    expect(samplePlaybackEngine).toContain(
      "export function scheduleCalibratedSample",
    )
  })

  it("keeps project domain independent from plugin UI model", () => {
    const violations = listSourceFiles(join(SRC_ROOT, "domain", "project"))
      .map(toProjectPath)
      .filter((file) => readProjectFile(file).includes("engine/plugins/pluginModel"))

    expect(violations).toEqual([])
  })

  it("keeps registered plugin summaries as DTOs without plugin UI definitions", () => {
    const pluginRegistry = readProjectFile("src/engine/plugins/pluginRegistry.ts")

    expect(pluginRegistry).not.toContain(
      "RegisteredPluginSummary = MiMIDIPluginDefinition",
    )
    expect(pluginRegistry).not.toContain("...p,")
  })

  it("keeps pluginModel as a compatibility facade without direct UI imports", () => {
    const pluginModel = readProjectFile("src/engine/plugins/pluginModel.ts")

    expect(pluginModel).not.toContain('from "react"')
    expect(pluginModel).not.toContain("../../app/appI18n")
    expect(pluginModel).not.toContain("React.ComponentType")
  })

  it("keeps pluginHostModel as a compatibility facade without direct UI imports", () => {
    const pluginHostModel = readProjectFile("src/engine/plugins/pluginHostModel.ts")

    expect(pluginHostModel).not.toContain('from "react"')
    expect(pluginHostModel).not.toContain("../../app/appI18n")
    expect(pluginHostModel).not.toContain("React.ComponentType")
  })

  it("keeps plugin-host contracts independent from engine", () => {
    const violations = listSourceFiles(join(SRC_ROOT, "plugin-host"))
      .map(toProjectPath)
      .filter((file) => /from ["'][^"']*engine\//.test(readProjectFile(file)))

    expect(violations).toEqual([])
  })

  it("keeps plugin UI features away from the pluginModel compatibility facade", () => {
    const pluginUiFiles = [
      "src/features/lab/LabApp.tsx",
      "src/features/plugins-view/PluginSlot.tsx",
      "src/features/plugins-view/PluginWorkspaceHost.tsx",
    ]

    const violations = pluginUiFiles.filter((file) =>
      readProjectFile(file).includes("engine/plugins/pluginModel"),
    )

    expect(violations).toEqual([])
  })

  it("keeps pluginApi away from the pluginModel compatibility facade", () => {
    const pluginApi = readProjectFile("src/engine/plugins/pluginApi.ts")

    expect(pluginApi).not.toContain("./pluginModel")
  })

  it("keeps pluginApi as a compatibility facade without React", () => {
    const pluginApi = readProjectFile("src/engine/plugins/pluginApi.ts")
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expect(pluginApi).not.toContain('from "react"')
    expect(pluginApi).not.toContain("useEffect")
    expect(labApp).not.toContain("engine/plugins/pluginApi")
  })

  it("keeps external plugin runtime globals behind the plugin-host boundary", () => {
    const compatibilityFacade = readProjectFile(
      "src/engine/plugins/externalPluginRuntimeGlobals.ts",
    )
    const consumers = [
      "src/engine/plugins/pluginLoader.ts",
      "src/features/plugins-view/useExternalPlugins.ts",
    ]

    expect(compatibilityFacade).not.toContain('from "react"')
    expect(compatibilityFacade).not.toContain("__MIMIDI_RUNTIME__")
    expect(
      consumers.filter((file) =>
        readProjectFile(file).includes("./externalPluginRuntimeGlobals"),
      ),
    ).toEqual([])
  })

  it("keeps useExternalPlugins as a compatibility facade without React", () => {
    const compatibilityFacade = readProjectFile(
      "src/engine/plugins/useExternalPlugins.ts",
    )
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expect(compatibilityFacade).not.toContain('from "react"')
    expect(compatibilityFacade).not.toContain("useState")
    expect(labApp).not.toContain("engine/plugins/useExternalPlugins")
  })

  it("keeps plugin runtime modules away from the pluginModel compatibility facade", () => {
    const pluginRuntimeFiles = [
      "src/engine/plugins/internalPlugins.ts",
      "src/engine/plugins/pluginLoader.ts",
      "src/engine/plugins/pluginRegistry.ts",
      "src/features/plugins-view/useExternalPlugins.ts",
    ]

    const violations = pluginRuntimeFiles.filter((file) =>
      readProjectFile(file).includes("./pluginModel"),
    )

    expect(violations).toEqual([])
  })

  it("keeps plugin runtime modules away from the pluginHostModel compatibility facade", () => {
    const pluginRuntimeFiles = [
      "src/engine/plugins/internalPlugins.ts",
      "src/engine/plugins/pluginApi.ts",
      "src/engine/plugins/pluginLoader.ts",
      "src/engine/plugins/pluginRegistry.ts",
      "src/engine/plugins/externalPluginRuntimeLoader.ts",
      "src/features/plugins-view/PluginSlot.tsx",
      "src/features/plugins-view/PluginWorkspaceHost.tsx",
    ]

    const violations = pluginRuntimeFiles.filter((file) => {
      const source = readProjectFile(file)
      return (
        source.includes("./pluginHostModel") ||
        source.includes("engine/plugins/pluginHostModel")
      )
    })

    expect(violations).toEqual([])
  })

  it("keeps the .mimod builder on the tested opt-in React policy", () => {
    const pluginBuilder = readProjectFile("scripts/build-plugin.mjs")

    expect(pluginBuilder).toContain(
      'import { createPluginEsbuildOptions } from "./pluginBuildOptions.mjs"',
    )
    expect(pluginBuilder).toContain(
      "...createPluginEsbuildOptions({ combinedCss })",
    )
    expect(pluginBuilder).not.toContain('"react/jsx-runtime":')
  })

  it("keeps external plugin manifest validation in the plugin domain", () => {
    const runtimeFiles = [
      "src/engine/plugins/pluginLoader.ts",
      "src/features/plugins-view/useExternalPlugins.ts",
    ]
    const forbiddenFragments = [
      "JSON.parse(await manifestFile.text())",
      "JSON.parse(strFromU8(manifestFile))",
      "manifest.json invalido",
      "MiMIDIPluginDefinition valido",
      "no coincide con el del modulo",
    ]

    const violations = runtimeFiles.flatMap((file) => {
      const source = readProjectFile(file)
      return forbiddenFragments
        .filter((fragment) => source.includes(fragment))
        .map((fragment) => `${file}: ${fragment}`)
    })

    expect(violations).toEqual([])
  })

  it("keeps external plugin dynamic module loading behind the runtime loader", () => {
    const coordinationFiles = [
      "src/engine/plugins/pluginLoader.ts",
      "src/features/plugins-view/useExternalPlugins.ts",
    ]
    const forbiddenFragments = [
      "new Blob(",
      "URL.createObjectURL",
      "URL.revokeObjectURL",
      "import(/* @vite-ignore */",
    ]

    const violations = coordinationFiles.flatMap((file) => {
      const source = readProjectFile(file)
      return forbiddenFragments
        .filter((fragment) => source.includes(fragment))
        .map((fragment) => `${file}: ${fragment}`)
    })

    expect(violations).toEqual([])
  })

  it("keeps pluginLoader free from React runtime globals", () => {
    const pluginLoader = readProjectFile("src/engine/plugins/pluginLoader.ts")

    expect(pluginLoader).not.toContain('from "react"')
    expect(pluginLoader).not.toContain("__MIMIDI_RUNTIME__")
  })

  it("keeps external plugin file installation behind an application use-case", () => {
    const useExternalPlugins = readProjectFile(
      "src/features/plugins-view/useExternalPlugins.ts",
    )

    expect(useExternalPlugins).not.toContain(
      "await saveExternalPlugin(manifest.id, data)",
    )
  })

  it("keeps external plugin restoration behind an application use-case", () => {
    const useExternalPlugins = readProjectFile(
      "src/features/plugins-view/useExternalPlugins.ts",
    )

    expect(useExternalPlugins).not.toContain("const ids = await listExternalPluginIds()")
    expect(useExternalPlugins).not.toContain("await loadExternalPlugin(id)")
    expect(useExternalPlugins).not.toContain("restored.push({ id, manifest })")
  })

  it("keeps development folder plugin installation behind an application use-case", () => {
    const useExternalPlugins = readProjectFile(
      "src/features/plugins-view/useExternalPlugins.ts",
    )

    expect(useExternalPlugins).not.toContain("parseExternalPluginManifest(")
    expect(useExternalPlugins).not.toContain("assertPluginDefinitionMatchesManifest(")
    expect(useExternalPlugins).not.toContain("exposeRuntime()")
    expect(useExternalPlugins).not.toContain(
      "await loadExternalPluginDefinitionFromJavaScript",
    )
    expect(useExternalPlugins).not.toContain("registerExternalPlugin(definition)")
  })

  it("keeps external plugin storage behind repository composition", () => {
    const useExternalPlugins = readProjectFile(
      "src/features/plugins-view/useExternalPlugins.ts",
    )

    expect(useExternalPlugins).not.toContain("./externalPluginStorage")
  })

  it("keeps external plugin legacy storage imports centralized", () => {
    const allowed = new Set([
      "src/application/use-cases/legacyExternalPluginUseCaseDependencies.ts",
    ])
    const violations = listSourceFiles(join(SRC_ROOT, "application"))
      .map(toProjectPath)
      .filter((file) =>
        readProjectFile(file).includes("engine/plugins/externalPluginStorage"),
      )
      .filter((file) => !allowed.has(file))

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
    const allowed = new Set<string>()
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
    expect(labApp).toContain(
      "resetLabProjectViewPreferencesWithRepository(settingsRepository, {",
    )
    expect(labApp).not.toContain(
      "clearLabActiveStepsTrackIdWithRepository(settingsRepository)",
    )
    expect(readProjectFile("src/features/step-sequencer/useMelodicSequencer.ts"))
      .not.toContain("mimidi-seq-steps")
  })

  it("keeps the project-only summary behind its feature read model", () => {
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")
    const composition = readProjectFile(
      "src/features/project-view/projectFeatureComposition.ts",
    )
    const readModel = readProjectFile(
      "src/features/project-view/projectFeatureReadModel.ts",
    )

    expect(labApp).toContain("createProjectFeatureComposition({")
    expect(labApp).not.toContain("resolveProjectFeatureReadModel")
    expect(composition).toContain("resolveProjectFeatureReadModel(project)")
    expect(readModel).not.toContain("../lab/LabApp")
    expect(readModel).not.toContain("react")
  })

  it("keeps Project View file import lifecycle behind its feature adapter", () => {
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")
    const fileImportHandlers = readProjectFile(
      "src/features/project-view/projectFeatureFileImportHandlers.ts",
    )

    expect(labApp).toContain("createProjectFeatureFileImportHandlers({")
    expect(labApp).not.toContain("async function handleImportProjectFile(")
    expect(labApp).not.toContain("async function handleImportBundle(")
    expect(fileImportHandlers).toContain("tearDownSession()")
    expect(fileImportHandlers).not.toContain("../lab/LabApp")
  })

  it("limits Project View Lab imports and owns its session boundary", () => {
    const allowedLabImports = new Set<string>()
    const projectViewFiles = listSourceFiles(
      join(SRC_ROOT, "features", "project-view"),
    ).map(toProjectPath)
    const labImportViolations = projectViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    ).filter((file) => !allowedLabImports.has(file))
    const projectFeatureView = readProjectFile(
      "src/features/project-view/ProjectFeatureView.tsx",
    )
    const localizedProjectFeatureView = readProjectFile(
      "src/features/project-view/LocalizedProjectFeatureView.tsx",
    )
    const appMode = readProjectFile("src/app/AppMode.tsx")
    const projectViewComposition = readProjectFile(
      "src/app/ProjectViewComposition.tsx",
    )
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expect(labImportViolations).toEqual([])
    expect(projectFeatureView).toContain(
      'import { ProjectSessionProvider } from "../project-session/ProjectSessionProvider"',
    )
    expect(projectFeatureView).toContain(
      "<ProjectSessionProvider projectFeature={projectFeature}>",
    )
    expect(labApp).not.toContain("ProjectSessionProvider")
    expect(labApp).toContain("<LocalizedProjectFeatureView")
    expect(labApp).not.toContain("exportBundleLabel:")
    expect(localizedProjectFeatureView).toContain("<ProjectFeatureView")
    expect(appMode).toContain("<ProjectViewComposition")
    expect(appMode).not.toContain('mode="project-only"')
    expect(projectViewComposition).toContain("useLabProject({")
    expect(projectViewComposition).toContain("useLabPlayback({")
    expect(projectViewComposition).not.toContain("useLabPerform")
    expect(projectViewComposition).not.toContain("useLabRecordingSession")
    expect(projectViewComposition).not.toContain("useMelodicSequencer")
    expect(projectViewComposition).not.toContain("usePadBeats")
    expect(projectViewComposition).not.toContain("useExternalPlugins")
  })

  it("keeps Plugins View independent from the legacy Lab composition", () => {
    const pluginsViewFiles = listSourceFiles(
      join(SRC_ROOT, "features", "plugins-view"),
    ).map(toProjectPath)
    const labImportViolations = pluginsViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    )
    const appMode = readProjectFile("src/app/AppMode.tsx")
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")
    const pluginsCatalogComposition = readProjectFile(
      "src/app/PluginsCatalogComposition.tsx",
    )
    const pluginWorkspaceView = readProjectFile(
      "src/features/plugins-view/PluginWorkspaceView.tsx",
    )

    expect(labImportViolations).toEqual([])
    expect(appMode).toContain("<PluginsCatalogComposition")
    expect(appMode).not.toContain('mode="plugins-only"')
    expect(appMode).toContain('mode="plugin-workspace"')
    expect(pluginsCatalogComposition).toContain("useLabProject({")
    expect(pluginsCatalogComposition).toContain("useExternalPlugins()")
    expect(pluginsCatalogComposition).not.toContain("useLabPlayback")
    expect(pluginsCatalogComposition).not.toContain("useLabPerform")
    expect(pluginsCatalogComposition).not.toContain("useLabRecordingSession")
    expect(pluginsCatalogComposition).not.toContain("useMelodicSequencer")
    expect(pluginsCatalogComposition).not.toContain("usePadBeats")
    expect(pluginsCatalogComposition).not.toContain("usePluginAPI")
    expect(labApp).toContain("<PluginsCatalogList")
    expect(labApp).not.toContain("lab.registeredPlugins.map((plugin)")
    expect(labApp).toContain("<PluginsCatalogImportToolbar")
    expect(labApp).toContain("<PluginsCatalogDevelopmentTools")
    expect(labApp).not.toContain('accept=".mimod"')
    expect(labApp).not.toContain('download="mimidi-plugin-sdk.d.ts"')
    expect(labApp).toContain("installPluginCatalogFile(")
    expect(labApp).toContain("installPluginCatalogFolder(")
    expect(labApp).toContain("uninstallPluginCatalogEntry(")
    expect(labApp).not.toContain("externalPlugins.installFromFile(file).then")
    expect(labApp).not.toContain("externalPlugins.installFromFolder().then")
    expect(labApp).not.toContain("No se pudo instalar el plugin:")
    expect(labApp).not.toContain("No se pudo cargar el plugin:")
    expect(labApp).toContain("<PluginWorkspaceView")
    expect(labApp).not.toContain("<PluginWorkspaceHost")
    expect(labApp).not.toContain('className="plugin-toast"')
    expect(pluginWorkspaceView).toContain("<PluginWorkspaceHost")
    expect(pluginWorkspaceView).toContain('className="plugin-toast"')
  })

  it("keeps useLabProject project persistence behind application use-cases", () => {
    const useLabProject = readProjectFile("src/features/lab/useLabProject.ts")

    expect(useLabProject).not.toContain("project/projectStorage")
    expect(useLabProject).not.toContain("loadStoredProject")
    expect(useLabProject).not.toContain("saveProject(")
    expect(useLabProject).not.toContain("parseImportedProject")
    expect(useLabProject).not.toContain("JSON.stringify(project")
    expect(useLabProject).not.toContain("function exportProject()")
    expect(useLabProject).not.toContain("function importProjectFile(")
    expect(useLabProject).toContain("useProjectJsonTransfer({")
    expect(useLabProject).not.toContain("function exportBundle()")
    expect(useLabProject).not.toContain("function importBundle(")
    expect(useLabProject).toContain("useProjectBundleTransfer({")
    expect(useLabProject).not.toContain("function exportProjectAudio(")
    expect(useLabProject).not.toContain(
      "const [isExportingAudio, setIsExportingAudio]",
    )
    expect(useLabProject).not.toContain(
      'typeof OfflineAudioContext === "undefined"',
    )
    expect(useLabProject).toContain("useProjectAudioTransfer({")
    expect(useLabProject).not.toContain("../history/useProjectHistory")
    expect(useLabProject).not.toContain("useProjectHistory<MusicalProject>")
    expect(useLabProject).not.toContain("const HISTORY_LIMIT")
    expect(useLabProject).not.toContain("function areProjectsEquivalent(")
    expect(useLabProject).toContain("useProjectSessionState(")
    expect(useLabProject).not.toContain("saveProjectSession(project)")
    expect(useLabProject).toContain("useProjectPersistenceSync({")
    expect(useLabProject).not.toContain(
      "const [activeTrackId, setActiveTrackId]",
    )
    expect(useLabProject).not.toContain(
      "const [selectedRecordedNoteId, setSelectedRecordedNoteId]",
    )
    expect(useLabProject).toContain("useProjectSelection({")
    expect(useLabProject).not.toContain("function clearSession()")
    expect(useLabProject).not.toContain("async function restartProject()")
    expect(useLabProject).toContain("useProjectSessionLifecycle({")
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
    expect(useLabProject).not.toContain(
      "tracks.length > 0 && !tracks.some",
    )
    expect(useLabProject).not.toContain("setActiveTrackId(tracks[0].id)")
    expect(useLabProject).not.toContain("resolveProjectChangeActiveTrackId")
    expect(useLabProject).not.toContain("resolveUndoProjectHistoryAction")
    expect(useLabProject).not.toContain("resolveRedoProjectHistoryAction")
    expect(useLabProject).not.toContain("function undoProjectEdit")
    expect(useLabProject).not.toContain("function redoProjectEdit")
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
    expect(useLabProject).not.toContain("getTrackNoteTimelineContentLength")
    expect(useLabProject).not.toContain("updateTrackNoteTimelineDuration")
    expect(useLabProject).not.toContain("compactTrackNotesStart")
    expect(useLabProject).not.toContain("getActiveClip")
    expect(useLabProject).not.toContain("getMidiTrackNotes")
    expect(useLabProject).not.toContain("getProjectTrackTimelineLength")
    expect(useLabProject).not.toContain("getTrackNoteTimelineLength")
    expect(useLabProject).not.toContain("getTrackVolumeAutomationValue")
    expect(useLabProject).not.toContain("isTrackAudible")
    expect(useLabProject).not.toContain("clearAllTrackNotes")
    expect(useLabProject).not.toContain("formatSessionClearedMessage")
    expect(useLabProject).not.toContain("applyUpdate((p) => resetProject(p))")
    expect(useLabProject).not.toContain("formatProjectRestartedMessage")
    expect(useLabProject).not.toContain(
      "const [projectMessage, setProjectMessage] = useState",
    )
    expect(useLabProject).toContain("useProjectMessages(")
    expect(useLabProject).not.toMatch(/^  updateSamplerTrackMuted,$/m)
    expect(useLabProject).not.toMatch(/^  updateSamplerTrackSolo,$/m)
    expect(useLabProject).not.toContain("updateSamplerTrackMuted(p,")
    expect(useLabProject).not.toContain("updateSamplerTrackSolo(p,")
    expect(useLabProject).not.toMatch(/^  updateAudioClipTrackMuted,$/m)
    expect(useLabProject).not.toContain("updateAudioClipTrackMuted(p,")
    expect(useLabProject).not.toMatch(/^  updateTrackMuted,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackSolo,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackPan,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackVolume,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackVolumeAutomation,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackEnvelope,$/m)
    expect(useLabProject).not.toMatch(/^  updateTrackInstrument,$/m)
    expect(useLabProject).not.toMatch(/^  renameProject,$/m)
    expect(useLabProject).not.toMatch(/^  renameTrack,$/m)
    expect(useLabProject).not.toContain("updateTrackMuted(p,")
    expect(useLabProject).not.toContain("updateTrackSolo(p,")
    expect(useLabProject).not.toContain("updateTrackPan(p,")
    expect(useLabProject).not.toContain("updateTrackVolume(p,")
    expect(useLabProject).not.toContain("updateTrackVolumeAutomation(p,")
    expect(useLabProject).not.toContain("updateTrackEnvelope(p,")
    expect(useLabProject).not.toContain("updateTrackInstrument(p,")
    expect(useLabProject).not.toContain("renameProject(p,")
    expect(useLabProject).not.toContain("renameTrack(p,")
    expect(useLabProject).not.toContain(
      "const currentIndex = tracks.findIndex",
    )
    expect(useLabProject).not.toContain("resolveTrackIdByOffset")
    expect(useLabProject).not.toContain("function switchActiveTrack")
    expect(useLabProject).not.toContain("function switchTrackByOffset")
    expect(useLabProject).not.toContain(
      "availableInstruments.find((i) => i.category === category)",
    )
    expect(useLabProject).not.toContain(
      "Duracion del timeline de notas ajustada al contenido de",
    )
    expect(useLabProject).not.toContain("No hay notas en")
    expect(useLabProject).not.toContain("ya empiezan en 0s")
    expect(useLabProject).not.toContain(
      "Inicio del timeline de notas compactado en",
    )
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
