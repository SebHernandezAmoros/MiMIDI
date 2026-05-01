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

export function useLabInstrumentCatalog(selectedInstrumentId: MathematicalInstrumentId) {
  const availableInstruments = useMemo(() => getAvailableMathematicalInstruments(), [])
  const selectedInstrument = useMemo(
    () => findAvailableMathematicalInstrument(selectedInstrumentId),
    [selectedInstrumentId],
  )
  const activeInstrumentCategory = selectedInstrument.category
  const instrumentCategories = useMemo(() => getInstrumentCategoriesFromCatalog(), [])
  const visibleInstruments = useMemo(
    () => getInstrumentsByCategory(activeInstrumentCategory),
    [activeInstrumentCategory],
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
