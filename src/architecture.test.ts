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

function expectSourceNotToContain(
  source: string,
  forbiddenFragments: string[],
): void {
  forbiddenFragments.forEach((fragment) => {
    expect(source).not.toContain(fragment)
  })
}

function listProjectSourceFiles(dir: string): string[] {
  return listSourceFiles(dir).map(toProjectPath)
}

function findSourceFilesMatching(
  dir: string,
  matches: (source: string, file: string) => boolean,
): string[] {
  return listProjectSourceFiles(dir)
    .filter((file) => matches(readProjectFile(file), file))
}

type ForbiddenPattern = {
  label: string
  pattern: RegExp
}

function findForbiddenPatternViolations(
  dir: string,
  forbiddenPatterns: ForbiddenPattern[],
): string[] {
  return listProjectSourceFiles(dir)
    .flatMap((file) => {
      const source = readProjectFile(file)

      return forbiddenPatterns
        .filter(({ pattern }) => pattern.test(source))
        .map(({ label }) => `${file}: ${label}`)
    })
}

describe("architecture boundaries", () => {
  it("keeps engine independent from app imports", () => {
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "engine"),
      (source) => source.includes("../../app/"),
    )

    expect(violations).toEqual([])
  })

  it("keeps engine independent from React imports", () => {
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "engine"),
      (source) => /from ["']react["']/.test(source),
    )

    expect(violations).toEqual([])
  })

  it("keeps application use-cases independent from React", () => {
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "application"),
      (source) => /from ["']react["']/.test(source),
    )

    expect(violations).toEqual([])
  })

  it("keeps browser APIs out of application", () => {
    const violations = findForbiddenPatternViolations(
      join(SRC_ROOT, "application"),
      [
        {
          label: "browser API",
          pattern: /\b(window|document|localStorage|indexedDB)\b/,
        },
      ],
    )

    expect(violations).toEqual([])
  })

  it("keeps domain independent from UI and browser infrastructure", () => {
    const forbiddenPatterns: ForbiddenPattern[] = [
      { label: "React import", pattern: /from ["']react["']/ },
      { label: "app import", pattern: /from ["'][^"']*app\// },
      { label: "features import", pattern: /from ["'][^"']*features\// },
      { label: "window API", pattern: /\bwindow\./ },
      { label: "document API", pattern: /\bdocument\./ },
      { label: "localStorage", pattern: /\blocalStorage\b/ },
      { label: "indexedDB", pattern: /\bindexedDB\b/ },
    ]
    const violations = findForbiddenPatternViolations(
      join(SRC_ROOT, "domain"),
      forbiddenPatterns,
    )

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

  it("keeps sequencer pattern persistence behind the settings repository facade", () => {
    const sequencerModel = readProjectFile("src/engine/audio/sequencerModel.ts")

    expect(sequencerModel).toContain("createLocalStorageSettingsRepository")
    expect(sequencerModel).toContain("export type SequencerSampleSlot")
    expect(sequencerModel).not.toContain("./sampleModel")
    expect(sequencerModel).not.toContain("localStorage.setItem")
    expect(sequencerModel).not.toContain("localStorage.getItem")
  })

  it("keeps offline sampler storage behind renderer dependencies", () => {
    const offlineAudioRenderer = readProjectFile(
      "src/engine/audio/offlineAudioRenderer.ts",
    )

    expect(offlineAudioRenderer).toContain(
      "export type OfflineRendererSampleDependencies",
    )
    expect(offlineAudioRenderer).toContain(
      "export async function renderProjectOfflineWithDependencies",
    )
    expect(offlineAudioRenderer).toContain("dependencies.loadSlotMetas()")
    expect(offlineAudioRenderer).toContain("dependencies.loadSampleBuffer(")
    expect(offlineAudioRenderer).toContain(
      "return renderProjectOfflineWithDependencies(",
    )
    expect(offlineAudioRenderer).not.toContain("const slots = loadSlotMetas()")
    expect(offlineAudioRenderer).not.toContain("await loadSampleBuffer(")
  })

  it("keeps engine sample storage facade imports explicitly classified", () => {
    const expected = [
      "src/engine/audio/offlineAudioRenderer.ts",
    ]
    const legacySampleFacadeImport =
      /from ["']\.\/(sampleModel|sampleStorage)["']/
    const actual = findSourceFilesMatching(
      join(SRC_ROOT, "engine"),
      (source, file) =>
        !file.includes("/__tests__/") && legacySampleFacadeImport.test(source),
    ).sort()

    expect(actual).toEqual(expected)
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
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "domain", "project"),
      (source) => source.includes("engine/plugins/pluginModel"),
    )

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

    expectSourceNotToContain(pluginModel, [
      'from "react"',
      "../../app/appI18n",
      "React.ComponentType",
    ])
  })

  it("keeps pluginHostModel as a compatibility facade without direct UI imports", () => {
    const pluginHostModel = readProjectFile("src/engine/plugins/pluginHostModel.ts")

    expectSourceNotToContain(pluginHostModel, [
      'from "react"',
      "../../app/appI18n",
      "React.ComponentType",
    ])
  })

  it("keeps plugin-host contracts independent from engine", () => {
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "plugin-host"),
      (source) => /from ["'][^"']*engine\//.test(source),
    )

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

    expectSourceNotToContain(pluginApi, ['from "react"', "useEffect"])
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

    expectSourceNotToContain(compatibilityFacade, [
      'from "react"',
      "__MIMIDI_RUNTIME__",
    ])
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

    expectSourceNotToContain(compatibilityFacade, ['from "react"', "useState"])
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

    expectSourceNotToContain(pluginLoader, ['from "react"', "__MIMIDI_RUNTIME__"])
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

  it("keeps external plugin legacy storage imports explicitly classified", () => {
    const expected = [
      "src/application/use-cases/legacyExternalPluginUseCaseDependencies.ts",
    ]
    const actual = findSourceFilesMatching(
      join(SRC_ROOT, "application"),
      (source) => source.includes("engine/plugins/externalPluginStorage"),
    ).sort()

    expect(actual).toEqual(expected)
  })

  it("keeps application storage legacy imports inside legacy dependency compositions", () => {
    const legacyStorageImport =
      /from ["']\.\.\/\.\.\/engine\/(audio\/(sampleModel|sampleStorage)|project\/projectStorage)["']/
    const legacyCompositionFile =
      /^src\/application\/use-cases\/legacy[A-Z].*UseCaseDependencies\.ts$/
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "application", "use-cases"),
      (source, file) =>
        !file.includes("/__tests__/") &&
        legacyStorageImport.test(source) &&
        !legacyCompositionFile.test(file),
    )

    expect(violations).toEqual([])
  })

  it("keeps remaining application storage legacy compositions explicitly classified", () => {
    const expected = [
      "src/application/use-cases/legacyMicRecordingUseCaseDependencies.ts",
      "src/application/use-cases/legacyPluginAudioOutputUseCaseDependencies.ts",
      "src/application/use-cases/legacyPluginClipLoadUseCaseDependencies.ts",
      "src/application/use-cases/legacyPluginClipStoreUseCaseDependencies.ts",
      "src/application/use-cases/legacyProjectBundleExportUseCaseDependencies.ts",
      "src/application/use-cases/legacyProjectBundleImportUseCaseDependencies.ts",
      "src/application/use-cases/legacyProjectLoadUseCaseDependencies.ts",
      "src/application/use-cases/legacyProjectSaveUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleImportUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleSlotCleanupUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleSlotLoadUseCaseDependencies.ts",
      "src/application/use-cases/legacySampleSlotSaveUseCaseDependencies.ts",
      "src/application/use-cases/legacySendSamplerMixToTimelineUseCaseDependencies.ts",
    ].sort()
    const legacyStorageImport =
      /from ["']\.\.\/\.\.\/engine\/(audio\/(sampleModel|sampleStorage)|project\/projectStorage)["']/
    const actual = findSourceFilesMatching(
      join(SRC_ROOT, "application", "use-cases"),
      (source, file) =>
        !file.includes("/__tests__/") && legacyStorageImport.test(source),
    ).sort()

    expect(actual).toEqual(expected)
  })

  it("keeps sample delete and decode dependencies independent from project storage", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain("project/projectStorage")
    expect(legacySampleDeleteDependencies).not.toContain("loadStoredProject")
    expect(legacySampleDeleteDependencies).not.toContain("saveProject")
    expect(legacySampleDecodeDependencies).not.toContain("project/projectStorage")
    expect(legacySampleDecodeDependencies).not.toContain("loadStoredProject")
    expect(legacySampleDecodeDependencies).not.toContain("saveProject")
  })

  it("keeps project session save on minimal project save dependencies", () => {
    const projectSessionPersistence = readProjectFile(
      "src/application/use-cases/projectSessionPersistence.ts",
    )
    const legacyProjectSaveDependencies = readProjectFile(
      "src/application/use-cases/legacyProjectSaveUseCaseDependencies.ts",
    )
    const saveProjectSessionWrapper = projectSessionPersistence.slice(
      projectSessionPersistence.indexOf(
        "export function saveProjectSession(project:",
      ),
    )

    expect(saveProjectSessionWrapper).toContain(
      "createLegacyProjectSaveUseCaseDependencies",
    )
    expect(saveProjectSessionWrapper).not.toContain(
      "createLegacyProjectUseCaseDependencies",
    )
    expect(projectSessionPersistence).toContain(
      'repository: Pick<ProjectRepository, "save">',
    )
    expect(legacyProjectSaveDependencies).toContain("saveProject")
    expect(legacyProjectSaveDependencies).not.toContain("loadStoredProject")
  })

  it("keeps project session load on minimal project load dependencies", () => {
    const projectSessionPersistence = readProjectFile(
      "src/application/use-cases/projectSessionPersistence.ts",
    )
    const legacyProjectLoadDependencies = readProjectFile(
      "src/application/use-cases/legacyProjectLoadUseCaseDependencies.ts",
    )
    const loadProjectSessionWrapper = projectSessionPersistence.slice(
      projectSessionPersistence.indexOf(
        "export function loadProjectSessionInitialProject():",
      ),
      projectSessionPersistence.indexOf(
        "export function saveProjectSession(project:",
      ),
    )

    expect(loadProjectSessionWrapper).toContain(
      "createLegacyProjectLoadUseCaseDependencies",
    )
    expect(loadProjectSessionWrapper).not.toContain(
      "createLegacyProjectUseCaseDependencies",
    )
    expect(projectSessionPersistence).toContain(
      'repository: Pick<ProjectRepository, "load">',
    )
    expect(legacyProjectLoadDependencies).toContain("loadStoredProject")
    expect(legacyProjectLoadDependencies).not.toContain("saveProject")
  })

  it("keeps sendSamplerMixToTimeline on named project load-save dependencies", () => {
    const sendSamplerMixToTimeline = readProjectFile(
      "src/application/use-cases/sendSamplerMixToTimeline.ts",
    )
    const legacySendSamplerMixDependencies = readProjectFile(
      "src/application/use-cases/legacySendSamplerMixToTimelineUseCaseDependencies.ts",
    )
    const useCaseFiles = listProjectSourceFiles(
      join(SRC_ROOT, "application", "use-cases"),
    )

    expect(sendSamplerMixToTimeline).toContain(
      "createLegacySendSamplerMixToTimelineUseCaseDependencies",
    )
    expect(sendSamplerMixToTimeline).toContain(
      "./legacySendSamplerMixToTimelineUseCaseDependencies",
    )
    expect(sendSamplerMixToTimeline).not.toContain(
      "createLegacyProjectUseCaseDependencies",
    )
    expect(legacySendSamplerMixDependencies).toContain("loadStoredProject")
    expect(legacySendSamplerMixDependencies).toContain("saveProject")
    expect(useCaseFiles).not.toContain(
      "src/application/use-cases/legacyProjectUseCaseDependencies.ts",
    )
  })

  it("keeps broad sample legacy dependencies retired", () => {
    const useCaseFiles = listProjectSourceFiles(
      join(SRC_ROOT, "application", "use-cases"),
    )

    expect(useCaseFiles).not.toContain(
      "src/application/use-cases/legacySampleUseCaseDependencies.ts",
    )
  })

  it("keeps plugin audio legacy dependencies out of sample dependencies", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const pluginAudioOutputs = readProjectFile(
      "src/application/use-cases/pluginAudioOutputs.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain("createLegacyPlugin")
    expect(legacySampleDecodeDependencies).not.toContain("createLegacyPlugin")
    expect(pluginAudioOutputs).toContain(
      "./legacyPluginAudioOutputUseCaseDependencies",
    )
    expect(pluginAudioOutputs).toContain(
      "./legacyPluginClipLoadUseCaseDependencies",
    )
    expect(pluginAudioOutputs).toContain(
      "./legacyPluginClipStoreUseCaseDependencies",
    )
    expect(pluginAudioOutputs).not.toContain(
      "./legacyPluginAudioUseCaseDependencies",
    )
  })

  it("keeps bundle legacy dependencies out of the sample composition", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const legacyProjectBundleExportDependencies = readProjectFile(
      "src/application/use-cases/legacyProjectBundleExportUseCaseDependencies.ts",
    )
    const legacyProjectBundleImportDependencies = readProjectFile(
      "src/application/use-cases/legacyProjectBundleImportUseCaseDependencies.ts",
    )
    const exportProjectBundle = readProjectFile(
      "src/application/use-cases/exportProjectBundle.ts",
    )
    const importProjectBundle = readProjectFile(
      "src/application/use-cases/importProjectBundle.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain("project/projectModel")
    expect(legacySampleDeleteDependencies).not.toContain("parseImportedProject")
    expect(legacySampleDecodeDependencies).not.toContain("project/projectModel")
    expect(legacySampleDecodeDependencies).not.toContain("parseImportedProject")
    expect(legacyProjectBundleExportDependencies).toContain("loadSlotMetas")
    expect(legacyProjectBundleExportDependencies).toContain("loadSampleBuffer")
    expect(legacyProjectBundleExportDependencies).not.toContain("parseImportedProject")
    expect(legacyProjectBundleExportDependencies).not.toContain("saveSlotMetas")
    expect(legacyProjectBundleExportDependencies).not.toContain("saveSampleBuffer")
    expect(legacyProjectBundleImportDependencies).toContain("parseImportedProject")
    expect(legacyProjectBundleImportDependencies).toContain("saveSlotMetas")
    expect(legacyProjectBundleImportDependencies).toContain("saveSampleBuffer")
    expect(legacyProjectBundleImportDependencies).not.toContain("loadSlotMetas")
    expect(legacyProjectBundleImportDependencies).not.toContain("loadSampleBuffer")
    expect(exportProjectBundle).toContain(
      "createLegacyProjectBundleExportUseCaseDependencies",
    )
    expect(importProjectBundle).toContain(
      "createLegacyProjectBundleImportUseCaseDependencies",
    )
    expect(exportProjectBundle).toContain(
      "./legacyProjectBundleExportUseCaseDependencies",
    )
    expect(importProjectBundle).toContain(
      "./legacyProjectBundleImportUseCaseDependencies",
    )
    expect(exportProjectBundle).not.toContain(
      "createLegacyProjectBundleUseCaseDependencies",
    )
    expect(importProjectBundle).not.toContain(
      "createLegacyProjectBundleUseCaseDependencies",
    )
    expect(exportProjectBundle).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(importProjectBundle).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
  })

  it("keeps deleteSampleSlot on minimal sample delete dependencies", () => {
    const deleteSampleSlot = readProjectFile(
      "src/application/use-cases/deleteSampleSlot.ts",
    )
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )

    expect(deleteSampleSlot).toContain(
      "createLegacySampleDeleteUseCaseDependencies",
    )
    expect(deleteSampleSlot).toContain("./legacySampleDeleteUseCaseDependencies")
    expect(deleteSampleSlot).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(deleteSampleSlot).not.toContain(
      "createLegacySampleBufferUseCaseDependencies",
    )
    expect(legacySampleDeleteDependencies).toContain("deleteSampleBuffer")
    expect(legacySampleDeleteDependencies).not.toContain("loadSampleBuffer")
    expect(legacySampleDeleteDependencies).not.toContain("saveSampleBuffer")
  })

  it("keeps loadSampleAudioBuffer on minimal decode dependencies", () => {
    const loadSampleAudioBuffer = readProjectFile(
      "src/application/use-cases/loadSampleAudioBuffer.ts",
    )

    expect(loadSampleAudioBuffer).toContain(
      "createLegacySampleDecodeUseCaseDependencies",
    )
    expect(loadSampleAudioBuffer).toContain("./legacySampleDecodeUseCaseDependencies")
    expect(loadSampleAudioBuffer).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
  })

  it("keeps importSampleFile on minimal import dependencies", () => {
    const importSampleFile = readProjectFile(
      "src/application/use-cases/importSampleFile.ts",
    )

    expect(importSampleFile).toContain(
      "createLegacySampleImportUseCaseDependencies",
    )
    expect(importSampleFile).toContain("./legacySampleImportUseCaseDependencies")
    expect(importSampleFile).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
  })

  it("keeps sample import legacy dependencies out of sample dependencies", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const importSampleFile = readProjectFile(
      "src/application/use-cases/importSampleFile.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain(
      "createLegacySampleImportUseCaseDependencies",
    )
    expect(legacySampleDecodeDependencies).not.toContain(
      "createLegacySampleImportUseCaseDependencies",
    )
    expect(importSampleFile).toContain("./legacySampleImportUseCaseDependencies")
  })

  it("keeps recordMicSample on minimal recording dependencies", () => {
    const recordMicSample = readProjectFile(
      "src/application/use-cases/recordMicSample.ts",
    )

    expect(recordMicSample).toContain(
      "createLegacyMicRecordingUseCaseDependencies",
    )
    expect(recordMicSample).toContain("./legacyMicRecordingUseCaseDependencies")
    expect(recordMicSample).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
  })

  it("keeps mic recording legacy dependencies out of sample dependencies", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const recordMicSample = readProjectFile(
      "src/application/use-cases/recordMicSample.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain(
      "createLegacyMicRecordingUseCaseDependencies",
    )
    expect(legacySampleDecodeDependencies).not.toContain(
      "createLegacyMicRecordingUseCaseDependencies",
    )
    expect(recordMicSample).toContain("./legacyMicRecordingUseCaseDependencies")
  })

  it("keeps sampleSlots on minimal slot dependencies", () => {
    const sampleSlots = readProjectFile(
      "src/application/use-cases/sampleSlots.ts",
    )

    expect(sampleSlots).toContain("createLegacySampleSlotLoadUseCaseDependencies")
    expect(sampleSlots).toContain("createLegacySampleSlotSaveUseCaseDependencies")
    expect(sampleSlots).not.toContain("createLegacySampleUseCaseDependencies")
    expect(sampleSlots).not.toContain("createLegacySampleSlotUseCaseDependencies")
  })

  it("keeps sample slot cleanup dependencies out of sample slot reads", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const sampleSlots = readProjectFile(
      "src/application/use-cases/sampleSlots.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain(
      "createLegacySampleSlotCleanupDependencies",
    )
    expect(legacySampleDecodeDependencies).not.toContain(
      "createLegacySampleSlotCleanupDependencies",
    )
    expect(sampleSlots).toContain(
      "./legacySampleSlotCleanupUseCaseDependencies",
    )
  })

  it("keeps sample slot read dependencies out of sample dependencies", () => {
    const legacySampleDeleteDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDeleteUseCaseDependencies.ts",
    )
    const legacySampleDecodeDependencies = readProjectFile(
      "src/application/use-cases/legacySampleDecodeUseCaseDependencies.ts",
    )
    const sampleSlots = readProjectFile(
      "src/application/use-cases/sampleSlots.ts",
    )
    const playSamplerMixes = readProjectFile(
      "src/application/use-cases/playSamplerMixes.ts",
    )

    expect(legacySampleDeleteDependencies).not.toContain(
      "createLegacySampleSlotUseCaseDependencies",
    )
    expect(legacySampleDecodeDependencies).not.toContain(
      "createLegacySampleSlotUseCaseDependencies",
    )
    expect(sampleSlots).toContain("./legacySampleSlotLoadUseCaseDependencies")
    expect(playSamplerMixes).toContain("./legacySampleSlotLoadUseCaseDependencies")
    expect(sampleSlots).toContain("./legacySampleSlotSaveUseCaseDependencies")
    expect(sampleSlots).not.toContain("./legacySampleSlotUseCaseDependencies")
    expect(playSamplerMixes).not.toContain("./legacySampleSlotUseCaseDependencies")
  })

  it("keeps playSamplerMixes on minimal slot dependencies", () => {
    const playSamplerMixes = readProjectFile(
      "src/application/use-cases/playSamplerMixes.ts",
    )
    const legacySampleSlotLoadDependencies = readProjectFile(
      "src/application/use-cases/legacySampleSlotLoadUseCaseDependencies.ts",
    )
    const legacySampleSlotSaveDependencies = readProjectFile(
      "src/application/use-cases/legacySampleSlotSaveUseCaseDependencies.ts",
    )

    expect(playSamplerMixes).toContain(
      "createLegacySampleSlotLoadUseCaseDependencies",
    )
    expect(playSamplerMixes).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(playSamplerMixes).not.toContain(
      "createLegacySampleSlotSaveUseCaseDependencies",
    )
    expect(legacySampleSlotLoadDependencies).toContain("loadSlotMetas")
    expect(legacySampleSlotLoadDependencies).not.toContain("saveSlotMetas")
    expect(legacySampleSlotSaveDependencies).toContain("saveSlotMetas")
    expect(legacySampleSlotSaveDependencies).not.toContain("loadSlotMetas")
    expect(
      listProjectSourceFiles(join(SRC_ROOT, "application", "use-cases")),
    ).not.toContain(
      "src/application/use-cases/legacySampleSlotUseCaseDependencies.ts",
    )
  })

  it("keeps storePluginClip on minimal plugin clip store dependencies", () => {
    const pluginAudioOutputs = readProjectFile(
      "src/application/use-cases/pluginAudioOutputs.ts",
    )
    const legacyPluginClipStoreDependencies = readProjectFile(
      "src/application/use-cases/legacyPluginClipStoreUseCaseDependencies.ts",
    )
    const storePluginClipWrapper = pluginAudioOutputs.slice(
      pluginAudioOutputs.indexOf("export async function storePluginClip("),
      pluginAudioOutputs.indexOf("export async function loadPluginClip("),
    )

    expect(storePluginClipWrapper).toContain(
      "createLegacyPluginClipStoreUseCaseDependencies",
    )
    expect(storePluginClipWrapper).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(legacyPluginClipStoreDependencies).toContain("saveSampleBuffer")
    expect(legacyPluginClipStoreDependencies).not.toContain("loadSampleBuffer")
    expect(legacyPluginClipStoreDependencies).not.toContain("loadSlotMetas")
    expect(legacyPluginClipStoreDependencies).not.toContain("decodeAudioData")
  })

  it("keeps loadPluginClip on minimal plugin clip load dependencies", () => {
    const pluginAudioOutputs = readProjectFile(
      "src/application/use-cases/pluginAudioOutputs.ts",
    )
    const legacyPluginClipLoadDependencies = readProjectFile(
      "src/application/use-cases/legacyPluginClipLoadUseCaseDependencies.ts",
    )
    const loadPluginClipWrapper = pluginAudioOutputs.slice(
      pluginAudioOutputs.indexOf("export async function loadPluginClip("),
      pluginAudioOutputs.indexOf(
        "export async function processPluginAudioOutput(",
      ),
    )

    expect(loadPluginClipWrapper).toContain(
      "createLegacyPluginClipLoadUseCaseDependencies",
    )
    expect(loadPluginClipWrapper).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(legacyPluginClipLoadDependencies).toContain("loadSampleBuffer")
    expect(legacyPluginClipLoadDependencies).not.toContain("saveSampleBuffer")
    expect(legacyPluginClipLoadDependencies).not.toContain("loadSlotMetas")
    expect(legacyPluginClipLoadDependencies).not.toContain("decodeAudioData")
  })

  it("keeps processPluginAudioOutput on minimal plugin audio output dependencies", () => {
    const pluginAudioOutputs = readProjectFile(
      "src/application/use-cases/pluginAudioOutputs.ts",
    )
    const legacyPluginAudioOutputDependencies = readProjectFile(
      "src/application/use-cases/legacyPluginAudioOutputUseCaseDependencies.ts",
    )
    const processPluginAudioOutputWrapper = pluginAudioOutputs.slice(
      pluginAudioOutputs.indexOf(
        "export async function processPluginAudioOutput(",
      ),
    )

    expect(processPluginAudioOutputWrapper).toContain(
      "createLegacyPluginAudioOutputUseCaseDependencies",
    )
    expect(processPluginAudioOutputWrapper).not.toContain(
      "createLegacySampleUseCaseDependencies",
    )
    expect(pluginAudioOutputs).toContain(
      'samples: Pick<SampleRepository, "save">',
    )
    expect(pluginAudioOutputs).not.toContain(
      'samples: Pick<SampleRepository, "load" | "save">',
    )
    expect(legacyPluginAudioOutputDependencies).toContain("decodeAudioData")
    expect(legacyPluginAudioOutputDependencies).toContain("loadSlotMetas")
    expect(legacyPluginAudioOutputDependencies).toContain("saveSlotMetas")
    expect(legacyPluginAudioOutputDependencies).toContain("saveSampleBuffer")
    expect(legacyPluginAudioOutputDependencies).not.toContain("loadSampleBuffer")
    expect(
      listProjectSourceFiles(join(SRC_ROOT, "application", "use-cases")),
    ).not.toContain(
      "src/application/use-cases/legacyPluginAudioUseCaseDependencies.ts",
    )
  })

  it("keeps feature storage legacy imports at zero", () => {
    const legacyStorageImport =
      /from ["']\.\.\/\.\.\/engine\/(audio\/(sampleModel|sampleStorage)|project\/projectStorage)["']/
    const violations = findSourceFilesMatching(
      join(SRC_ROOT, "features"),
      (source, file) =>
        !file.includes("/__tests__/") && legacyStorageImport.test(source),
    )

    expect(violations).toEqual([])
  })

  it("keeps AppMode settings storage behind repositories", () => {
    const appMode = readProjectFile("src/app/AppMode.tsx")

    expectSourceNotToContain(appMode, [
      "localStorage",
      "mimidi-dark-mode",
      "mimidi-show-key-labels",
      "mimidi-master-volume",
    ])
  })

  it("keeps tutorial progress keys behind application use-cases", () => {
    const tutorialStorage = readProjectFile(
      "src/features/tutorial/tutorialStorage.ts",
    )
    const tutorialOverlay = readProjectFile(
      "src/features/tutorial/TutorialOverlay.tsx",
    )

    expectSourceNotToContain(tutorialStorage, [
      "localStorage.getItem",
      "localStorage.setItem",
      "mimidi-tutorial-seen",
      "mimidi-complete-tutorial-seen",
    ])
    expectSourceNotToContain(tutorialOverlay, [
      "localStorage.getItem",
      "mimidi-dark-mode",
    ])
  })

  it("keeps app language storage behind repositories", () => {
    const appI18n = readProjectFile("src/app/appI18n.ts")

    expectSourceNotToContain(appI18n, ["localStorage", "mimidi-language"])
  })

  it("keeps migrated Lab view preferences behind application use-cases", () => {
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")

    expectSourceNotToContain(labApp, [
      "localStorage.getItem",
      "localStorage.setItem",
      "localStorage.removeItem",
      "mimidi-pad-view-mode",
      "mimidi-piano-view-mode",
      "mimidi-seq-active-steps-track",
      "mimidi-seq-bpm",
      "mimidi-seq-subdivision",
    ])
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
    expectSourceNotToContain(readModel, ["../lab/LabApp", "react"])
  })

  it("keeps Project View file import lifecycle behind its feature adapter", () => {
    const labApp = readProjectFile("src/features/lab/LabApp.tsx")
    const fileImportHandlers = readProjectFile(
      "src/features/project-view/projectFeatureFileImportHandlers.ts",
    )

    expect(labApp).toContain("createProjectFeatureFileImportHandlers({")
    expectSourceNotToContain(labApp, [
      "async function handleImportProjectFile(",
      "async function handleImportBundle(",
    ])
    expect(fileImportHandlers).toContain("tearDownSession()")
    expect(fileImportHandlers).not.toContain("../lab/LabApp")
  })

  it("limits Project View Lab imports and owns its session boundary", () => {
    const projectViewFiles = listProjectSourceFiles(
      join(SRC_ROOT, "features", "project-view"),
    )
    const labImportViolations = projectViewFiles.filter((file) =>
      /from ["'][^"']*\/lab(?:\/|["'])/.test(readProjectFile(file)),
    )
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
    expect(labApp).toContain("<LocalizedProjectFeatureView")
    expect(localizedProjectFeatureView).toContain("<ProjectFeatureView")
    expect(appMode).toContain("<ProjectViewComposition")
    expect(appMode).not.toContain('mode="project-only"')
    expect(projectViewComposition).toContain(
      "useProjectPlaybackComposition({",
    )
    expectSourceNotToContain(projectViewComposition, [
      "useLabProject({",
      "useLabPlayback({",
    ])
    expect(projectPlaybackComposition).toContain("useLabProject(options)")
    expect(projectPlaybackComposition).toContain(
      "useLabPlayback({ project: projectSession.project })",
    )
    expect(labApp).toContain("useProjectPerformanceComposition({")
    expectSourceNotToContain(labApp, [
      "ProjectSessionProvider",
      "exportBundleLabel:",
      "useLabInstrumentCatalog(",
      "useLabRecordingSession({",
      "useLabPerform({",
    ])
    expect(projectPerformanceComposition).toContain(
      "useLabInstrumentCatalog(",
    )
    expect(projectPerformanceComposition).toContain(
      "useLabRecordingSession({",
    )
    expect(projectPerformanceComposition).toContain("useLabPerform({")
    expectSourceNotToContain(projectPerformanceComposition, [
      "useMelodicSequencer",
      "usePadBeats",
      "TrackTimelinePreview",
    ])
    expectSourceNotToContain(projectViewComposition, [
      "useLabPerform",
      "useLabRecordingSession",
      "useMelodicSequencer",
      "usePadBeats",
      "useExternalPlugins",
    ])
  })

  it("keeps Plugins View independent from the legacy Lab composition", () => {
    const pluginsViewFiles = listProjectSourceFiles(
      join(SRC_ROOT, "features", "plugins-view"),
    )
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
    expectSourceNotToContain(pluginsCatalogComposition, [
      "useLabPlayback",
      "useLabPerform",
      "useLabRecordingSession",
      "useMelodicSequencer",
      "usePadBeats",
      "usePluginAPI",
    ])
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
    expectSourceNotToContain(pluginWorkspaceComposition, [
      "useMelodicSequencer",
      "usePadBeats",
      "TrackTimelinePreview",
    ])
    expect(labApp).toContain("<PluginsCatalogList")
    expect(labApp).toContain("<PluginsCatalogImportToolbar")
    expect(labApp).toContain("<PluginsCatalogDevelopmentTools")
    expect(labApp).toContain("installPluginCatalogFile(")
    expect(labApp).toContain("installPluginCatalogFolder(")
    expect(labApp).toContain("uninstallPluginCatalogEntry(")
    expectSourceNotToContain(labApp, [
      "lab.registeredPlugins.map((plugin)",
      'accept=".mimod"',
      'download="mimidi-plugin-sdk.d.ts"',
      "externalPlugins.installFromFile(file).then",
      "externalPlugins.installFromFolder().then",
      "No se pudo instalar el plugin:",
      "No se pudo cargar el plugin:",
    ])
    expect(labApp).toContain("<PluginWorkspaceView")
    expect(labApp).toContain("usePluginWorkspaceNotification()")
    expectSourceNotToContain(labApp, [
      "pluginToastTimerRef",
      "setPluginToast",
      "setTimeout(() => setPluginToast",
    ])
    expect(labApp).toContain("handlePluginWorkspaceOutput(")
    expectSourceNotToContain(labApp, [
      "appendTrackWithNotes",
      "addAudioClipTrack",
      "processPluginAudioOutput(output).then",
    ])
    expect(labApp).toContain("getPluginWorkspaceTracks(lab.project.timeline)")
    expect(labApp).toContain("getPluginWorkspaceBpm(lab.project.timeline)")
    expect(labApp).toContain("usePluginWorkspaceNotePreview({")
    expect(labApp).toContain("createPluginWorkspaceClipStorage({")
    expect(labApp).toContain("usePluginWorkspaceAPI({")
    expectSourceNotToContain(labApp, [
      "usePluginAPI({",
      "../../plugin-host/pluginApi",
      "pluginVoicesRef",
    ])
    expect(labApp).not.toContain(
      "instrumentCatalog.availableInstruments.find(i => i.id === instrumentId)",
    )
    expectSourceNotToContain(labApp, [
      "storeClip: (blob) => storePluginClip(blob)",
      "loadClip: (dbId) => loadPluginClip(dbId)",
    ])
    expectSourceNotToContain(labApp, [
      "getSamplerTracks(lab.project.timeline)[0]?.pattern.bpm ?? 120",
      '.filter(tr => tr.trackType !== "steps")',
    ])
    expectSourceNotToContain(labApp, [
      "<PluginWorkspaceHost",
      'className="plugin-toast"',
    ])
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
    const editViewFiles = listProjectSourceFiles(
      join(SRC_ROOT, "features", "edit"),
    )
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
    const editTrackLaneToolbarCapabilities = readProjectFile(
      "src/features/edit/trackLaneToolbarCapabilities.ts",
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
    expectSourceNotToContain(editActiveTrackSelect, [
      "useLabProject",
      "TrackTimelinePreview",
    ])
    expect(editTimelineViewToggle).toContain("data-tutorial=\"view-tracks-tab\"")
    expectSourceNotToContain(editTimelineViewToggle, [
      "useLabProject",
      "TrackTimelinePreview",
    ])
    expect(editTimelineToolbar).toContain("<EditTimelineViewToggle")
    expect(editTimelineToolbar).toContain("<EditActiveTrackSelect")
    expectSourceNotToContain(editTimelineToolbar, [
      "useLabProject",
      "TrackTimelinePreview",
    ])
    expect(editTrackLaneToolbarCapabilities).toContain("getTrackDataHandler")
    expect(editTrackLaneToolbarCapabilities).toContain("resolveActiveTrackLaneContext")
    expect(editTrackLaneToolbarCapabilities).toContain("canSolo")
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveTrackLaneDuplicateClipAvailability",
    )
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveTrackLaneDuplicateClipCommand",
    )
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveTrackLaneDeleteClipAction",
    )
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveTrackLaneMuteSoloState",
    )
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveSelectedTrackLaneClipDeletion",
    )
    expect(editTrackLaneToolbarCapabilities).toContain(
      "resolveSelectedTrackLaneClipDeleteCommand",
    )
    expect(editTrackNameInput).toContain(
      'className="edit-note-input edit-track-name-input"',
    )
    expectSourceNotToContain(editTrackNameInput, [
      "useLabProject",
      "TrackTimelinePreview",
    ])
    expect(editTimelineView).toContain("resolveInitialEditTimelineView")
    expect(editTimelineView).toContain("popstate")
    expect(editTimelineView).not.toContain("TrackTimelinePreview")
    expect(editViewComposition).toContain('mode="edit-only"')
    expectSourceNotToContain(editViewComposition, [
      "TrackTimelinePreview",
      "useMelodicSequencer",
      "usePadBeats",
    ])
    expect(labApp).toContain("useEditTimelineView({")
    expect(labApp).toContain("<EditTimelineToolbar")
    expect(labApp).toContain("resolveActiveTrackLaneContext")
    expect(labApp).toContain("resolveTrackLaneToolbarCapabilities")
    expect(labApp).toContain("resolveSelectedTrackLaneClipDeletion")
    expect(labApp).toContain("resolveSelectedTrackLaneClipDeleteCommand")
    expect(labApp).toContain("resolveTrackLaneDuplicateClipAvailability")
    expect(labApp).toContain("resolveTrackLaneDuplicateClipCommand")
    expect(labApp).toContain("resolveTrackLaneDeleteClipAction")
    expect(labApp).toContain("resolveTrackLaneMuteSoloState")
    expectSourceNotToContain(labApp, [
      "<EditActiveTrackSelect",
      "<EditTimelineViewToggle",
    ])
    expectSourceNotToContain(labApp, [
      "disabled={!!activeAudioTrack}",
      "!toolbarCapabilities.canDuplicateClip ||",
      "{!activeAudioTrack && (",
    ])
    expectSourceNotToContain(labApp, [
      "const canDeleteSelectedClip = (() =>",
      "selectedClipId.type",
      "const isMuted = activeSamplerTrack ?",
    ])
    expectSourceNotToContain(labApp, [
      "activeAudioTrack ? false : lab.primaryTrack.solo",
      "activeSamplerTrack && lastMixClip",
      "!activeAudioTrack && lab.activeClip",
    ])
    expectSourceNotToContain(labApp, [
      "const activeSamplerTrack = selectedLaneId",
      "const activeAudioTrack = !activeSamplerTrack && selectedLaneId",
    ])
    expect(labApp).toContain("<EditTrackNameInput")
    expectSourceNotToContain(labApp, [
      'aria-label={t.toolbar.selectTrack}',
      'className="edit-note-input edit-track-name-input"',
      'data-tutorial="view-tracks-tab"',
    ])
    expectSourceNotToContain(labApp, [
      'role="group" aria-label={`${t.toolbar.viewNotes}/${t.toolbar.viewTracks}`}',
      'new URLSearchParams(window.location.search).get("timelineView")',
      'window.addEventListener("popstate", syncTimelineView)',
    ])
  })

  it("keeps Perform View presentation independent from the legacy Lab composition", () => {
    const performViewFiles = listProjectSourceFiles(
      join(SRC_ROOT, "features", "perform"),
    )
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
    expectSourceNotToContain(performViewComposition, [
      "useMelodicSequencer",
      "usePadBeats",
      "TrackTimelinePreview",
    ])
  })

  it("keeps Sampler View presentation independent from the legacy Lab composition", () => {
    const samplerViewFiles = listProjectSourceFiles(
      join(SRC_ROOT, "features", "sampler"),
    )
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
    expectSourceNotToContain(samplerViewComposition, [
      "useMelodicSequencer",
      "usePadBeats",
      "TrackTimelinePreview",
    ])
  })

  it("keeps feature boundaries independent from the legacy Lab composition", () => {
    const featureFiles = listProjectSourceFiles(join(SRC_ROOT, "features"))
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
    const trackTimelineDrag = readProjectFile(
      "src/features/timeline/trackTimelineDrag.ts",
    )
    const audioClipTimelineLane = readProjectFile(
      "src/features/timeline/AudioClipTimelineLane.tsx",
    )
    const midiTimelineLane = readProjectFile(
      "src/features/timeline/MidiTimelineLane.tsx",
    )
    const midiTimelineClip = readProjectFile(
      "src/features/timeline/MidiTimelineClip.tsx",
    )
    const midiTimelineClipMarkers = readProjectFile(
      "src/features/timeline/MidiTimelineClipMarkers.tsx",
    )
    const samplerTimelineLane = readProjectFile(
      "src/features/timeline/SamplerTimelineLane.tsx",
    )
    const trackLaneDefinitions = readProjectFile(
      "src/features/timeline/trackLaneDefinitions.ts",
    )

    expect(trackTimelinePreview).toContain("createTrackTimelineLaneGroups")
    expect(trackTimelinePreview).toContain("resolveTrackTimelineDraggedClipStart")
    expect(
      trackTimelinePreview.match(/resolveTrackTimelineDraggedClipStart/g) ?? [],
    ).toHaveLength(4)
    expect(trackTimelinePreview).not.toContain("function preventOverlap")
    expect(trackTimelinePreview).toContain("<AudioClipTimelineLane")
    expect(trackTimelinePreview).toContain("<MidiTimelineLane")
    expect(trackTimelinePreview).toContain("<SamplerTimelineLane")
    expectSourceNotToContain(trackTimelinePreview, [
      "getMidiTracks",
      "getSamplerTracks",
      "getAudioClipTracks",
    ])
    expectSourceNotToContain(trackTimelinePreview, [
      "trackTimelineClipsById",
      "track.clips.map((clip: AudioClip)",
      "<MidiTimelineClip",
    ])
    expectSourceNotToContain(trackTimelinePreview, [
      "<MidiTimelineClipMarkers",
      "track-timeline-note-marker-smc",
      "notesSuffix} ·",
    ])
    expect(audioClipTimelineLane).toContain("track-timeline-clip track-timeline-clip-mix")
    expect(audioClipTimelineLane).toContain("onClipPointerDown")
    expect(midiTimelineLane).toContain("laneViewModel.name")
    expect(midiTimelineLane).toContain("laneViewModel.muted")
    expect(midiTimelineLane).toContain("laneViewModel.summaryLabel")
    expect(midiTimelineLane).toContain("<MidiTimelineClip")
    expect(midiTimelineLane).toContain("onClipPointerDown")
    expect(midiTimelineClip).toContain("track-timeline-clip-selected")
    expect(midiTimelineClip).toContain("<MidiTimelineClipMarkers")
    ;[audioClipTimelineLane, midiTimelineLane, midiTimelineClip].forEach((source) => {
      expectSourceNotToContain(source, ["TrackTimelinePreview"])
    })
    expect(midiTimelineClipMarkers).toContain("track-timeline-note-marker")
    expect(midiTimelineClipMarkers).toContain("isSmcPadRecordedNote")
    expect(samplerTimelineLane).toContain("track-timeline-mix-name-input")
    expect(samplerTimelineLane).toContain("onClipPointerDown")
    expect(trackTimelineViewModel).toContain("getTrackTimelineClips")
    expect(trackTimelineViewModel).toContain("getTrackDataHandler")
    expect(trackTimelineViewModel).toContain("getTrackLaneDefinition")
    expect(trackTimelineViewModel).toContain("createTrackTimelineLaneGroups")
    expect(trackTimelineViewModel).toContain("clipsById")
    expect(trackTimelineViewModel).toContain("definition")
    expect(trackTimelineViewModel).toContain("summaryLabel")
    expect(trackTimelineViewModel).toContain("capabilities")
    expect(trackTimelineDrag).toContain("preventTrackTimelineClipOverlap")
    expect(trackTimelineDrag).toContain("resolveTrackTimelineDraggedClipStart")
    expect(trackTimelineDrag).not.toContain("react")
    ;[midiTimelineClipMarkers, samplerTimelineLane, trackTimelineDrag].forEach(
      (source) => {
        expectSourceNotToContain(source, ["TrackTimelinePreview"])
      },
    )
    expect(trackLaneDefinitions).toContain("trackLaneDefinitions")
    expect(trackLaneDefinitions).toContain("getTrackLaneDefinition")
    expectSourceNotToContain(trackLaneDefinitions, [
      "react",
      "TrackTimelinePreview",
    ])
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
    expectSourceNotToContain(audioClipTrackScheduler, [
      "react",
      "useLabPlayback",
      "features/lab",
    ])
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
    expectSourceNotToContain(samplerTrackScheduler, [
      "react",
      "useLabPlayback",
      "features/lab",
    ])
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
    expectSourceNotToContain(midiTrackScheduler, [
      "react",
      "useLabPlayback",
      "features/lab",
      "audioEngine",
    ])
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
    expectSourceNotToContain(trackSchedulers, [
      "react",
      "useLabPlayback",
      "features/lab",
      "audioEngine",
    ])
  })

  it("keeps current track kinds registered across track system contracts", () => {
    const trackDataHandlers = readProjectFile(
      "src/domain/project/trackDataHandlers.ts",
    )
    const trackLaneDefinitions = readProjectFile(
      "src/features/timeline/trackLaneDefinitions.ts",
    )
    const trackSchedulers = readProjectFile(
      "src/application/use-cases/trackSchedulers.ts",
    )
    const trackKinds = ["midi", "sampler", "audio-clip"]
    const trackSystemContracts = [
      ["trackDataHandlers", trackDataHandlers],
      ["trackLaneDefinitions", trackLaneDefinitions],
      ["trackSchedulers", trackSchedulers],
    ] as const

    const missingRegistrations = trackKinds.flatMap((kind) =>
      trackSystemContracts
        .filter(([, source]) => !source.includes(`"${kind}"`))
        .map(([contract]) => `${contract}: ${kind}`),
    )

    expect(missingRegistrations).toEqual([])
  })

  it("keeps useLabProject project persistence behind application use-cases", () => {
    const useLabProject = readProjectFile("src/features/lab/useLabProject.ts")

    expectSourceNotToContain(useLabProject, [
      "project/projectStorage",
      "loadStoredProject",
      "saveProject(",
      "parseImportedProject",
      "JSON.stringify(project",
      "function exportProject()",
      "function importProjectFile(",
    ])
    expect(useLabProject).toContain("useProjectJsonTransfer({")
    expectSourceNotToContain(useLabProject, [
      "function exportBundle()",
      "function importBundle(",
    ])
    expect(useLabProject).toContain("useProjectBundleTransfer({")
    expectSourceNotToContain(useLabProject, [
      "function exportProjectAudio(",
      "const [isExportingAudio, setIsExportingAudio]",
      'typeof OfflineAudioContext === "undefined"',
    ])
    expect(useLabProject).toContain("useProjectAudioTransfer({")
    expectSourceNotToContain(useLabProject, [
      "../history/useProjectHistory",
      "useProjectHistory<MusicalProject>",
      "const HISTORY_LIMIT",
      "function areProjectsEquivalent(",
      "saveProjectSession(project)",
    ])
    expect(useLabProject).toContain("useProjectSessionState(")
    expect(useLabProject).toContain("useProjectPersistenceSync({")
    expectSourceNotToContain(useLabProject, [
      "const [activeTrackId, setActiveTrackId]",
      "const [selectedRecordedNoteId, setSelectedRecordedNoteId]",
    ])
    expect(useLabProject).toContain("useProjectSelection({")
    expectSourceNotToContain(useLabProject, [
      "function clearSession()",
      "async function restartProject()",
    ])
    expect(useLabProject).toContain("useProjectSessionLifecycle({")
    expectSourceNotToContain(useLabProject, [
      "exportProjectBundle",
      "importProjectBundle(",
      "exportProjectAudioUseCase",
      "Audio WAV",
    ])
    expectSourceNotToContain(useLabProject, [
      "targetType: ProjectTrackType",
      "const primaryTrack = (() =>",
      "const selectedRecordedNote =\n    primaryTrackNotes.find",
    ])
    expectSourceNotToContain(useLabProject, [
      "setActiveTrackId(\n      getMidiTracks(previousProject.timeline)",
      "setActiveTrackId(\n      getMidiTracks(nextProject.timeline)",
      "setActiveTrackId(getMidiTracks(importedProject.timeline)[0]?.id",
      "tracks.length > 0 && !tracks.some",
      "setActiveTrackId(tracks[0].id)",
      "resolveProjectChangeActiveTrackId",
    ])
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
