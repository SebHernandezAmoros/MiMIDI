import { decodeAudioData } from "../../engine/audio/audioEngine"
import { loadSlotMetas, saveSlotMetas } from "../../engine/audio/sampleModel"
import {
  deleteSampleBuffer,
  loadSampleBuffer,
  saveSampleBuffer,
} from "../../engine/audio/sampleStorage"
import { parseImportedProject } from "../../engine/project/projectModel"
import { loadStoredProject, saveProject } from "../../engine/project/projectStorage"
import { createSampleDbId } from "./sampleIds"

export function createLegacySampleUseCaseDependencies() {
  return {
    createSampleId: createSampleDbId,
    decodeAudioData,
    now: () => new Date(),
    parseProject: parseImportedProject,
    projects: {
      load: loadStoredProject,
      save: saveProject,
    },
    sampleSlots: {
      loadSlots: loadSlotMetas,
      saveSlots: saveSlotMetas,
    },
    samples: {
      delete: deleteSampleBuffer,
      load: loadSampleBuffer,
      save: saveSampleBuffer,
    },
  }
}

export function createLegacySampleSlotCleanupDependencies() {
  return {
    sampleSlots: {
      loadSlots: loadSlotMetas,
      saveSlots: saveSlotMetas,
    },
    samples: {
      delete: deleteSampleBuffer,
    },
  }
}
