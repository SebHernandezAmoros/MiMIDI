import type { CSSProperties } from "react"

export const classicAppTheme = {
  colors: {
    textStrong: "#2B2B2B",
    borderDark: "#555555",
    surfaceMid: "#808080",
    surfaceLight: "#C0C0C0",
    surfaceBright: "#E0E0E0",
  },
  fonts: {
    primary: '"VT323", "IBM Plex Mono", "Courier New", monospace',
  },
} as const

export function getClassicAppThemeStyle() {
  return {
    "--app-color-text-strong": classicAppTheme.colors.textStrong,
    "--app-color-border-dark": classicAppTheme.colors.borderDark,
    "--app-color-surface-mid": classicAppTheme.colors.surfaceMid,
    "--app-color-surface-light": classicAppTheme.colors.surfaceLight,
    "--app-color-surface-bright": classicAppTheme.colors.surfaceBright,
    "--app-font-primary": classicAppTheme.fonts.primary,
  } as CSSProperties
}
