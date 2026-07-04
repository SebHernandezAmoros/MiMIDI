export type InstrumentCategoryOption<TInstrumentId extends string = string> = {
  id: TInstrumentId
  category: string
}

export function resolveInstrumentIdByCategory<
  TInstrumentId extends string,
>(
  category: string,
  availableInstruments: readonly InstrumentCategoryOption<TInstrumentId>[],
): TInstrumentId | null {
  return (
    availableInstruments.find(
      (instrument) => instrument.category === category,
    )?.id ?? null
  )
}
