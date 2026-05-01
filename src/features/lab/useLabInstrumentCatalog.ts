import { useMemo } from "react"
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
import type { MiMIDIPluginStateMap } from "../../engine/plugins/pluginModel"

export function useLabInstrumentCatalog(
  selectedInstrumentId: MathematicalInstrumentId,
  pluginStates: MiMIDIPluginStateMap,
) {
  const availableInstruments = useMemo(
    () => getAvailableMathematicalInstruments(pluginStates),
    [pluginStates],
  )
  const selectedInstrument = useMemo(
    () => findAvailableMathematicalInstrument(selectedInstrumentId, pluginStates),
    [selectedInstrumentId, pluginStates],
  )
  const activeInstrumentCategory = selectedInstrument.category
  const instrumentCategories = useMemo(
    () => getInstrumentCategoriesFromCatalog(pluginStates),
    [pluginStates],
  )
  const visibleInstruments = useMemo(
    () => getInstrumentsByCategory(activeInstrumentCategory, pluginStates),
    [activeInstrumentCategory, pluginStates],
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
