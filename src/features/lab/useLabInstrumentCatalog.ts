import { useEffect, useMemo, useState } from "react"
import {
  findAvailableMathematicalInstrument,
  getAvailableMathematicalInstruments,
  getInstrumentCategoriesFromCatalog,
  getInstrumentsByCategory,
} from "../../engine/audio/instrumentCatalog"
import type {
  MathematicalInstrument,
  MathematicalInstrumentId,
} from "../../engine/audio/mathematicalInstruments"
import type { MiMIDIPluginStateMap } from "../../domain/plugins/pluginContracts"
import { subscribeToPluginRegistry } from "../../engine/plugins/pluginRegistry"

export function useLabInstrumentCatalog(
  selectedInstrumentId: MathematicalInstrumentId,
  pluginStates: MiMIDIPluginStateMap,
) {
  const [pluginRegistryVersion, setPluginRegistryVersion] = useState(0)

  useEffect(
    () => subscribeToPluginRegistry(() => setPluginRegistryVersion((version) => version + 1)),
    [],
  )

  const availableInstruments = useMemo(
    () => getAvailableMathematicalInstruments(pluginStates),
    [pluginStates, pluginRegistryVersion],
  )
  const selectedInstrument = useMemo(
    () => findAvailableMathematicalInstrument(selectedInstrumentId, pluginStates),
    [selectedInstrumentId, pluginStates, pluginRegistryVersion],
  )
  const activeInstrumentCategory = selectedInstrument.category
  const instrumentCategories = useMemo(
    () => getInstrumentCategoriesFromCatalog(pluginStates),
    [pluginStates, pluginRegistryVersion],
  )
  const visibleInstruments = useMemo(
    () => getInstrumentsByCategory(activeInstrumentCategory, pluginStates),
    [activeInstrumentCategory, pluginStates, pluginRegistryVersion],
  )

  return {
    activeInstrumentCategory,
    availableInstruments,
    instrumentCategories,
    selectedInstrument,
    visibleInstruments,
  } satisfies {
    activeInstrumentCategory: MathematicalInstrument["category"]
    availableInstruments: MathematicalInstrument[]
    instrumentCategories: MathematicalInstrument["category"][]
    selectedInstrument: MathematicalInstrument
    visibleInstruments: MathematicalInstrument[]
  }
}
