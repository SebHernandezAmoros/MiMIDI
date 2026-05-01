import {
  coreMathematicalInstruments,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "./mathematicalInstruments"
import type { MiMIDIPluginStateMap } from "../plugins/pluginModel"
import { getPluginInstruments } from "../plugins/pluginRegistry"

function sortInstrumentCategories(
  firstCategory: MathematicalInstrument["category"],
  secondCategory: MathematicalInstrument["category"],
) {
  if (firstCategory === secondCategory) {
    return 0
  }

  return firstCategory === "base" ? -1 : 1
}

export function getAvailableMathematicalInstruments(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
) {
  return [...coreMathematicalInstruments, ...getPluginInstruments(pluginStates)]
}

export function findAvailableMathematicalInstrument(
  instrumentId: MathematicalInstrumentId,
  pluginStates?: Partial<MiMIDIPluginStateMap>,
) {
  const availableInstruments = getAvailableMathematicalInstruments(pluginStates)

  return (
    availableInstruments.find((instrument) => instrument.id === instrumentId) ??
    availableInstruments[0]
  )
}

export function getInstrumentCategoriesFromCatalog(
  pluginStates?: Partial<MiMIDIPluginStateMap>,
) {
  return [
    ...new Set(
      getAvailableMathematicalInstruments(pluginStates).map(
        (instrument) => instrument.category,
      ),
    ),
  ].sort(sortInstrumentCategories)
}

export function getInstrumentsByCategory(
  category: MathematicalInstrument["category"],
  pluginStates?: Partial<MiMIDIPluginStateMap>,
) {
  return getAvailableMathematicalInstruments(pluginStates).filter(
    (instrument) => instrument.category === category,
  )
}
