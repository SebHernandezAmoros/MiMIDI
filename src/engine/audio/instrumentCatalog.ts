import {
  coreMathematicalInstruments,
  type MathematicalInstrument,
  type MathematicalInstrumentId,
} from "./mathematicalInstruments"
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

export function getAvailableMathematicalInstruments() {
  return [...coreMathematicalInstruments, ...getPluginInstruments()]
}

export function findAvailableMathematicalInstrument(
  instrumentId: MathematicalInstrumentId,
) {
  return (
    getAvailableMathematicalInstruments().find((instrument) => instrument.id === instrumentId) ??
    getAvailableMathematicalInstruments()[0]
  )
}

export function getInstrumentCategoriesFromCatalog() {
  return [...new Set(getAvailableMathematicalInstruments().map((instrument) => instrument.category))]
    .sort(sortInstrumentCategories)
}

export function getInstrumentsByCategory(
  category: MathematicalInstrument["category"],
) {
  return getAvailableMathematicalInstruments().filter(
    (instrument) => instrument.category === category,
  )
}
