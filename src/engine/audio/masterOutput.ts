import { getAudioContext } from "./audioContextManager"

export type MasterOutputDependencies = {
  getAudioContext(): AudioContext
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function createMasterOutput(
  dependencies: MasterOutputDependencies,
) {
  let masterGainNode: GainNode | null = null

  function getMasterGainNode(
    context = dependencies.getAudioContext(),
  ): GainNode {
    if (!masterGainNode) {
      masterGainNode = context.createGain()
      masterGainNode.gain.setValueAtTime(0.8, context.currentTime)
      masterGainNode.connect(context.destination)
    }

    return masterGainNode
  }

  function setMasterVolume(volume: number): void {
    const context = dependencies.getAudioContext()
    const masterGain = getMasterGainNode(context)
    const nextVolume = clamp(volume, 0, 1)

    masterGain.gain.setTargetAtTime(nextVolume, context.currentTime, 0.01)
  }

  return {
    getMasterGainNode,
    setMasterVolume,
  }
}

const browserMasterOutput = createMasterOutput({ getAudioContext })

export const getMasterGainNode = browserMasterOutput.getMasterGainNode
export const setMasterVolume = browserMasterOutput.setMasterVolume
