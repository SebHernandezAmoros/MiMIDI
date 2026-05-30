import type { PropsWithChildren, ReactNode } from "react"
import { getClassicAppThemeStyle } from "./appTheme"

type AppShellProps = PropsWithChildren<{
  subtitle: string
  title: string
  portraitMessage: string
  toolbar?: ReactNode
}>

export function AppShell({ children, subtitle, title, portraitMessage, toolbar }: AppShellProps) {
  void subtitle
  void toolbar

  return (
    <main className="app-shell app-theme-classic" style={getClassicAppThemeStyle()}>
      <section className="app-shell-portrait-blocker" aria-label={portraitMessage}>
        <strong>{title}</strong>
        <p>{portraitMessage}</p>
      </section>

      <div className="app-shell-live-content">
        <section className="app-shell-workspace">{children}</section>
      </div>
    </main>
  )
}
