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
    const projectPlaybackComposition = readProjectFile(
      "src/app/useProjectPlaybackComposition.ts",
    )
    const projectPerformanceComposition = readProjectFile(
      "src/app/useProjectPerformanceComposition.ts",
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
    expect(projectViewComposition).toContain(
      "useProjectPlaybackComposition({",
    )
    expect(projectViewComposition).not.toContain("useLabProject({")
    expect(projectViewComposition).not.toContain("useLabPlayback({")
    expect(projectPlaybackComposition).toContain("useLabProject(options)")
    expect(projectPlaybackComposition).toContain(
      "useLabPlayback({ project: projectSession.project })",
    )
    expect(labApp).toContain("useProjectPerformanceComposition({")
    expect(labApp).not.toContain("useLabInstrumentCatalog(")
    expect(labApp).not.toContain("useLabRecordingSession({")
    expect(labApp).not.toContain("useLabPerform({")
    expect(projectPerformanceComposition).toContain(
      "useLabInstrumentCatalog(",
    )
    expect(projectPerformanceComposition).toContain(
      "useLabRecordingSession({",
    )
    expect(projectPerformanceComposition).toContain("useLabPerform({")
    expect(projectPerformanceComposition).not.toContain(
      "useMelodicSequencer",
    )
    expect(projectPerformanceComposition).not.toContain("usePadBeats")
    expect(projectPerformanceComposition).not.toContain(
      "TrackTimelinePreview",
    )
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
    const pluginWorkspaceComposition = readProjectFile(
      "src/app/PluginWorkspaceComposition.tsx",
    )
    const pluginWorkspaceView = readProjectFile(
      "src/features/plugins-view/PluginWorkspaceView.tsx",
    )
    const pluginWorkspaceNotification = readProjectFile(
      "src/features/plugins-view/usePluginWorkspaceNotification.ts",
    )
    const pluginWorkspaceOutputs = readProjectFile(
      "src/features/plugins-view/pluginWorkspaceOutputs.ts",
    )
    const pluginWorkspaceTracks = readProjectFile(
      "src/features/plugins-view/pluginWorkspaceTracks.ts",
    )
    const pluginWorkspaceTempo = readProjectFile(
      "src/features/plugins-view/pluginWorkspaceTempo.ts",
    )
    const pluginWorkspaceNotePreview = readProjectFile(
      "src/features/plugins-view/usePluginWorkspaceNotePreview.ts",
    )
    const pluginWorkspaceClipStorage = readProjectFile(
      "src/features/plugins-view/pluginWorkspaceClipStorage.ts",
    )
    const pluginWorkspaceAPI = readProjectFile(
      "src/features/plugins-view/usePluginWorkspaceAPI.ts",
    )

    expect(labImportViolations).toEqual([])
    expect(appMode).toContain("<PluginsCatalogComposition")
    expect(appMode).not.toContain('mode="plugins-only"')
    expect(appMode).toContain("<PluginWorkspaceComposition")
    expect(appMode).not.toContain('mode="plugin-workspace"')
    expect(appMode).not.toContain("../features/lab/LabApp")
    expect(pluginsCatalogComposition).toContain("useLabProject({")
    expect(pluginsCatalogComposition).toContain("useExternalPlugins()")
    expect(pluginsCatalogComposition).not.toContain("useLabPlayback")
    expect(pluginsCatalogComposition).not.toContain("useLabPerform")
    expect(pluginsCatalogComposition).not.toContain("useLabRecordingSession")
    expect(pluginsCatalogComposition).not.toContain("useMelodicSequencer")
    expect(pluginsCatalogComposition).not.toContain("usePadBeats")
    expect(pluginsCatalogComposition).not.toContain("usePluginAPI")
    expect(pluginWorkspaceComposition).toContain(
      "useProjectPlaybackComposition({",
    )
    expect(pluginWorkspaceComposition).toContain(
      "useProjectPerformanceComposition({ projectSession })",
    )
    expect(pluginWorkspaceComposition).toContain(
      "usePluginWorkspaceAPI({",
    )
    expect(pluginWorkspaceComposition).toContain("<PluginWorkspaceView")
    expect(pluginWorkspaceComposition).not.toContain(
      "useMelodicSequencer",
    )
    expect(pluginWorkspaceComposition).not.toContain("usePadBeats")
    expect(pluginWorkspaceComposition).not.toContain(
      "TrackTimelinePreview",
    )
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
    expect(labApp).toContain("usePluginWorkspaceNotification()")
    expect(labApp).not.toContain("pluginToastTimerRef")
    expect(labApp).not.toContain("setPluginToast")
    expect(labApp).not.toContain("setTimeout(() => setPluginToast")
    expect(labApp).toContain("handlePluginWorkspaceOutput(")
    expect(labApp).not.toContain("appendTrackWithNotes")
    expect(labApp).not.toContain("addAudioClipTrack")
    expect(labApp).not.toContain("processPluginAudioOutput(output).then")
    expect(labApp).toContain("getPluginWorkspaceTracks(lab.project.timeline)")
    expect(labApp).toContain("getPluginWorkspaceBpm(lab.project.timeline)")
    expect(labApp).toContain("usePluginWorkspaceNotePreview({")
    expect(labApp).toContain("createPluginWorkspaceClipStorage({")
    expect(labApp).toContain("usePluginWorkspaceAPI({")
    expect(labApp).not.toContain("usePluginAPI({")
    expect(labApp).not.toContain("../../plugin-host/pluginApi")
    expect(labApp).not.toContain("pluginVoicesRef")
    expect(labApp).not.toContain(
      "instrumentCatalog.availableInstruments.find(i => i.id === instrumentId)",
    )
    expect(labApp).not.toContain(
      "storeClip: (blob) => storePluginClip(blob)",
    )
    expect(labApp).not.toContain(
      "loadClip: (dbId) => loadPluginClip(dbId)",
    )
    expect(labApp).not.toContain(
      "getSamplerTracks(lab.project.timeline)[0]?.pattern.bpm ?? 120",
    )
    expect(labApp).not.toContain(
      '.filter(tr => tr.trackType !== "steps")',
    )
    expect(labApp).not.toContain("<PluginWorkspaceHost")
    expect(labApp).not.toContain('className="plugin-toast"')
    expect(pluginWorkspaceView).toContain("<PluginWorkspaceHost")
    expect(pluginWorkspaceView).toContain('className="plugin-toast"')
    expect(pluginWorkspaceNotification).toContain(
      "PLUGIN_WORKSPACE_NOTIFICATION_DURATION_MS = 3500",
    )
    expect(pluginWorkspaceNotification).toContain("clearTimeout(timerRef.current)")
    expect(pluginWorkspaceOutputs).toContain("appendTrackWithNotes(")
    expect(pluginWorkspaceOutputs).toContain("addAudioClipTrack(")
    expect(pluginWorkspaceOutputs).toContain(
      "dependencies.notifySamplerSlotsChanged()",
    )
    expect(pluginWorkspaceOutputs).toContain("dependencies.saveFile(")
    expect(pluginWorkspaceTracks).toContain(
      '.filter((track) => track.trackType !== "steps")',
    )
    expect(pluginWorkspaceTracks).toContain(
      'type: track.trackType === "melodic" ? "melodic" : "percussion"',
    )
    expect(pluginWorkspaceTempo).toContain(
      "getSamplerTracks(timeline)[0]?.pattern.bpm",
    )
    expect(pluginWorkspaceTempo).toContain(
      "DEFAULT_PLUGIN_WORKSPACE_BPM = 120",
    )
    expect(pluginWorkspaceNotePreview).toContain(
      "voicesRef.current.set(note, voiceId)",
    )
    expect(pluginWorkspaceNotePreview).toContain(
      "voicesRef.current.delete(note)",
    )
    expect(pluginWorkspaceClipStorage).toContain(
      "return dependencies.storeClip(blob)",
    )
    expect(pluginWorkspaceClipStorage).toContain(
      "return dependencies.loadClip(dbId)",
    )
    expect(pluginWorkspaceAPI).toContain("return usePluginAPI({")
    expect(pluginWorkspaceAPI).toContain(
      "isPlaying: dependencies.transport.isPlaying",
    )
    expect(pluginWorkspaceAPI).toContain(
      "receivePluginOutput: dependencies.session.receivePluginOutput",
    )
  })

  it("keeps Edit View presentation independent from the legacy Lab composition", () => {
    const editViewFiles = listSourceFiles(
      join(SRC_ROOT, "features", "edit"),
    ).map(toProjectPath)
    const labImportViolations = editViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    )
    const appMode = readProjectFile("src/app/AppMode.tsx")
    const editScreen = readProjectFile("src/features/edit/EditScreen.tsx")
    const editWorkspace = readProjectFile("src/features/edit/EditWorkspace.tsx")
    const editActiveTrackSelect = readProjectFile(
      "src/features/edit/EditActiveTrackSelect.tsx",
    )
    const editTimelineViewToggle = readProjectFile(
      "src/features/edit/EditTimelineViewToggle.tsx",
    )
    const editTimelineToolbar = readProjectFile(
      "src/features/edit/EditTimelineToolbar.tsx",
    )
    const editTrackNameInput = readProjectFile(
      "src/features/edit/EditTrackNameInput.tsx",
    )
    const editTimelineView = readProjectFile(
      "src/features/edit/useEditTimelineView.ts",
    )
    const editViewComposition = readProjectFile(
      "src/app/EditViewComposition.tsx",
    )
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expect(labImportViolations).toEqual([])
    expect(appMode).toContain("<EditViewComposition")
    expect(appMode).not.toContain('mode="edit-only"')
    expect(editScreen).toContain("editContent")
    expect(editWorkspace).toContain("{editContent}")
    expect(editWorkspace).not.toContain("LabApp")
    expect(editActiveTrackSelect).toContain('className="ui-select"')
    expect(editActiveTrackSelect).not.toContain("useLabProject")
    expect(editActiveTrackSelect).not.toContain("TrackTimelinePreview")
    expect(editTimelineViewToggle).toContain("data-tutorial=\"view-tracks-tab\"")
    expect(editTimelineViewToggle).not.toContain("useLabProject")
    expect(editTimelineViewToggle).not.toContain("TrackTimelinePreview")
    expect(editTimelineToolbar).toContain("<EditTimelineViewToggle")
    expect(editTimelineToolbar).toContain("<EditActiveTrackSelect")
    expect(editTimelineToolbar).not.toContain("useLabProject")
    expect(editTimelineToolbar).not.toContain("TrackTimelinePreview")
    expect(editTrackNameInput).toContain(
      'className="edit-note-input edit-track-name-input"',
    )
    expect(editTrackNameInput).not.toContain("useLabProject")
    expect(editTrackNameInput).not.toContain("TrackTimelinePreview")
    expect(editTimelineView).toContain("resolveInitialEditTimelineView")
    expect(editTimelineView).toContain("popstate")
    expect(editTimelineView).not.toContain("TrackTimelinePreview")
    expect(editViewComposition).toContain('mode="edit-only"')
    expect(editViewComposition).not.toContain("TrackTimelinePreview")
    expect(editViewComposition).not.toContain("useMelodicSequencer")
    expect(editViewComposition).not.toContain("usePadBeats")
    expect(labApp).toContain("useEditTimelineView({")
    expect(labApp).toContain("<EditTimelineToolbar")
    expect(labApp).not.toContain("<EditActiveTrackSelect")
    expect(labApp).not.toContain("<EditTimelineViewToggle")
    expect(labApp).toContain("<EditTrackNameInput")
    expect(labApp).not.toContain(
      'aria-label={t.toolbar.selectTrack}',
    )
    expect(labApp).not.toContain(
      'className="edit-note-input edit-track-name-input"',
    )
    expect(labApp).not.toContain("data-tutorial=\"view-tracks-tab\"")
    expect(labApp).not.toContain(
      'role="group" aria-label={`${t.toolbar.viewNotes}/${t.toolbar.viewTracks}`}',
    )
    expect(labApp).not.toContain(
      'new URLSearchParams(window.location.search).get("timelineView")',
    )
    expect(labApp).not.toContain(
      'window.addEventListener("popstate", syncTimelineView)',
    )
  })

  it("keeps Perform View presentation independent from the legacy Lab composition", () => {
    const performViewFiles = listSourceFiles(
      join(SRC_ROOT, "features", "perform"),
    ).map(toProjectPath)
    const labImportViolations = performViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    )
    const appMode = readProjectFile("src/app/AppMode.tsx")
    const performScreen = readProjectFile("src/features/perform/PerformScreen.tsx")
    const performWorkspace = readProjectFile(
      "src/features/perform/PerformWorkspace.tsx",
    )
    const performWebWorkspace = readProjectFile(
      "src/features/perform/PerformWebWorkspace.tsx",
    )
    const performViewComposition = readProjectFile(
      "src/app/PerformViewComposition.tsx",
    )

    expect(labImportViolations).toEqual([])
    expect(appMode).toContain("<PerformViewComposition")
    expect(appMode).not.toContain('mode="perform-only"')
    expect(performScreen).toContain("performContent")
    expect(performWorkspace).toContain("{performContent}")
    expect(performWorkspace).not.toContain("LabApp")
    expect(performWebWorkspace).toContain("{performContent}")
    expect(performWebWorkspace).not.toContain("LabApp")
    expect(performViewComposition).toContain('mode="perform-only"')
    expect(performViewComposition).not.toContain("useMelodicSequencer")
    expect(performViewComposition).not.toContain("usePadBeats")
    expect(performViewComposition).not.toContain("TrackTimelinePreview")
  })

  it("keeps Sampler View presentation independent from the legacy Lab composition", () => {
    const samplerViewFiles = listSourceFiles(
      join(SRC_ROOT, "features", "sampler"),
    ).map(toProjectPath)
    const labImportViolations = samplerViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    )
    const appMode = readProjectFile("src/app/AppMode.tsx")
    const samplerScreen = readProjectFile("src/features/sampler/SamplerScreen.tsx")
    const samplerViewComposition = readProjectFile(
      "src/app/SamplerViewComposition.tsx",
    )

    expect(labImportViolations).toEqual([])
    expect(appMode).toContain("<SamplerViewComposition")
    expect(appMode).not.toContain('mode="sampler-only"')
    expect(samplerScreen).toContain("samplerContent")
    expect(samplerScreen).not.toContain("LabApp")
    expect(samplerViewComposition).toContain('mode="sampler-only"')
    expect(samplerViewComposition).not.toContain("useMelodicSequencer")
    expect(samplerViewComposition).not.toContain("usePadBeats")
    expect(samplerViewComposition).not.toContain("TrackTimelinePreview")
  })

  it("keeps feature boundaries independent from the legacy Lab composition", () => {
    const featureFiles = listSourceFiles(join(SRC_ROOT, "features"))
      .map(toProjectPath)
      .filter((file) => !file.startsWith("src/features/lab/"))
    const labImportViolations = featureFiles.filter((file) =>
      /from ["'][^"']*(?:features\/lab|\/lab)(?:\/|["'])/.test(
        readProjectFile(file),
      ),
    )

    expect(labImportViolations).toEqual([])
  })

  it("keeps TrackTimelinePreview render derivations on track data handlers", () => {
    const trackTimelinePreview = readProjectFile(
      "src/features/timeline/TrackTimelinePreview.tsx",
    )
    const trackTimelineViewModel = readProjectFile(
      "src/features/timeline/trackTimelineViewModel.ts",
    )
    const audioClipTimelineLane = readProjectFile(
      "src/features/timeline/AudioClipTimelineLane.tsx",
    )
    const samplerTimelineLane = readProjectFile(
      "src/features/timeline/SamplerTimelineLane.tsx",
    )
    const trackLaneDefinitions = readProjectFile(
      "src/features/timeline/trackLaneDefinitions.ts",
    )

    expect(trackTimelinePreview).toContain("createTrackTimelineLaneGroups")
    expect(trackTimelinePreview).toContain("<AudioClipTimelineLane")
    expect(trackTimelinePreview).toContain("<SamplerTimelineLane")
    expect(trackTimelinePreview).toContain("laneViewModel.name")
    expect(trackTimelinePreview).toContain("laneViewModel.muted")
    expect(trackTimelinePreview).toContain("laneViewModel.summaryLabel")
    expect(trackTimelinePreview).not.toContain("getMidiTracks")
    expect(trackTimelinePreview).not.toContain("getSamplerTracks")
    expect(trackTimelinePreview).not.toContain("getAudioClipTracks")
    expect(trackTimelinePreview).not.toContain("trackTimelineClipsById")
    expect(trackTimelinePreview).not.toContain("track.clips.map((clip: AudioClip)")
    expect(trackTimelinePreview).not.toContain("notesSuffix} ·")
    expect(audioClipTimelineLane).toContain("track-timeline-clip track-timeline-clip-mix")
    expect(audioClipTimelineLane).toContain("onClipPointerDown")
    expect(audioClipTimelineLane).not.toContain("TrackTimelinePreview")
    expect(samplerTimelineLane).toContain("track-timeline-mix-name-input")
    expect(samplerTimelineLane).toContain("onClipPointerDown")
    expect(samplerTimelineLane).not.toContain("TrackTimelinePreview")
    expect(trackTimelineViewModel).toContain("getTrackTimelineClips")
    expect(trackTimelineViewModel).toContain("getTrackDataHandler")
    expect(trackTimelineViewModel).toContain("getTrackLaneDefinition")
    expect(trackTimelineViewModel).toContain("createTrackTimelineLaneGroups")
    expect(trackTimelineViewModel).toContain("clipsById")
    expect(trackTimelineViewModel).toContain("definition")
    expect(trackTimelineViewModel).toContain("summaryLabel")
    expect(trackTimelineViewModel).toContain("capabilities")
    expect(trackLaneDefinitions).toContain("trackLaneDefinitions")
    expect(trackLaneDefinitions).toContain("getTrackLaneDefinition")
    expect(trackLaneDefinitions).not.toContain("react")
    expect(trackLaneDefinitions).not.toContain("TrackTimelinePreview")
  })

  it("keeps audio clip track scheduling behind a track scheduler", () => {
    const scheduleAudioClipTracks = readProjectFile(
      "src/application/use-cases/scheduleAudioClipTracks.ts",
    )
    const audioClipTrackScheduler = readProjectFile(
      "src/application/use-cases/audioClipTrackScheduler.ts",
    )

    expect(scheduleAudioClipTracks).toContain("getTrackScheduler")
    expect(scheduleAudioClipTracks).toContain("scheduler.schedule")
    expect(scheduleAudioClipTracks).not.toContain(
      "scheduleAudioClipTrackWithDependencies",
    )
    expect(audioClipTrackScheduler).toContain('kind: "audio-clip"')
    expect(audioClipTrackScheduler).toContain("schedule")
    expect(audioClipTrackScheduler).not.toContain("react")
    expect(audioClipTrackScheduler).not.toContain("useLabPlayback")
    expect(audioClipTrackScheduler).not.toContain("features/lab")
  })

  it("keeps sampler track playback behind a track scheduler", () => {
    const playSamplerMixes = readProjectFile(
      "src/application/use-cases/playSamplerMixes.ts",
    )
    const samplerTrackScheduler = readProjectFile(
      "src/application/use-cases/samplerTrackScheduler.ts",
    )

    expect(playSamplerMixes).toContain("getTrackScheduler")
    expect(playSamplerMixes).toContain("scheduler.schedule")
    expect(playSamplerMixes).not.toContain("scheduleSamplerTrackWithDependencies")
    expect(samplerTrackScheduler).toContain('kind: "sampler"')
    expect(samplerTrackScheduler).toContain("schedule")
    expect(samplerTrackScheduler).not.toContain("react")
    expect(samplerTrackScheduler).not.toContain("useLabPlayback")
    expect(samplerTrackScheduler).not.toContain("features/lab")
  })

  it("keeps MIDI scheduled note resolution behind a track scheduler", () => {
    const playRecordedNotes = readProjectFile(
      "src/application/use-cases/playRecordedNotes.ts",
    )
    const midiTrackScheduler = readProjectFile(
      "src/application/use-cases/midiTrackScheduler.ts",
    )

    expect(playRecordedNotes).toContain("getTrackScheduler")
    expect(playRecordedNotes).toContain("scheduler.getScheduledNotes")
    expect(playRecordedNotes).not.toContain("getMidiTrackScheduledNotes")
    expect(playRecordedNotes).not.toContain("getScheduledTrackNotes")
    expect(midiTrackScheduler).toContain('kind: "midi"')
    expect(midiTrackScheduler).toContain("getScheduledNotes")
    expect(midiTrackScheduler).not.toContain("react")
    expect(midiTrackScheduler).not.toContain("useLabPlayback")
    expect(midiTrackScheduler).not.toContain("features/lab")
    expect(midiTrackScheduler).not.toContain("audioEngine")
  })

  it("keeps track schedulers registered behind a declarative registry", () => {
    const trackSchedulers = readProjectFile(
      "src/application/use-cases/trackSchedulers.ts",
    )

    expect(trackSchedulers).toContain("trackSchedulers")
    expect(trackSchedulers).toContain("getTrackScheduler")
    expect(trackSchedulers).toContain("midiTrackScheduler")
    expect(trackSchedulers).toContain("samplerTrackScheduler")
    expect(trackSchedulers).toContain("audioClipTrackScheduler")
    expect(trackSchedulers).not.toContain("react")
    expect(trackSchedulers).not.toContain("useLabPlayback")
    expect(trackSchedulers).not.toContain("features/lab")
    expect(trackSchedulers).not.toContain("audioEngine")
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
