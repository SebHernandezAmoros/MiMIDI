export function createSampleDbId(): string {
  return `sample-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
