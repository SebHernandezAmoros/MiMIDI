export type SettingsRepository = {
  getBoolean(key: string, fallback: boolean): boolean
  setBoolean(key: string, value: boolean): void
  getNumber(key: string, fallback: number): number
  setNumber(key: string, value: number): void
  getString(key: string, fallback: string): string
  setString(key: string, value: string): void
  remove(key: string): void
}
