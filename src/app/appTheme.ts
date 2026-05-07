import type { CSSProperties } from "react"

export const classicAppTheme = {
  colors: {
    backgroundCanvas: "#bcbcbc",
    borderSoft: "#b3aba2",
    surfacePaper: "#efefef",
    surfacePaperAlt: "#dddddd",
    textStrong: "#303030",
    textMuted: "#686868",
    accent: "#E24B32",
    borderDark: "#9b938a",
    surfaceMid: "#bdbdbd",
    surfaceLight: "#d4d4d4",
    surfaceBright: "#ececec",
  },
  fonts: {
    primary: '"VT323", "IBM Plex Mono", "Courier New", monospace',
  },
} as const

export function getClassicAppThemeStyle() {
  return {
    "--app-color-background-canvas": classicAppTheme.colors.backgroundCanvas,
    "--app-color-border-soft": classicAppTheme.colors.borderSoft,
    "--app-color-surface-paper": classicAppTheme.colors.surfacePaper,
    "--app-color-surface-paper-alt": classicAppTheme.colors.surfacePaperAlt,
    "--app-color-text-strong": classicAppTheme.colors.textStrong,
    "--app-color-text-muted": classicAppTheme.colors.textMuted,
    "--app-color-accent": classicAppTheme.colors.accent,
    "--app-color-border-dark": classicAppTheme.colors.borderDark,
    "--app-color-surface-mid": classicAppTheme.colors.surfaceMid,
    "--app-color-surface-light": classicAppTheme.colors.surfaceLight,
    "--app-color-surface-bright": classicAppTheme.colors.surfaceBright,
    "--app-font-primary": classicAppTheme.fonts.primary,
  } as CSSProperties
}
