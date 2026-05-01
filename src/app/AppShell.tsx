import type { PropsWithChildren, ReactNode } from "react"
import { getClassicAppThemeStyle } from "./appTheme"

type AppShellProps = PropsWithChildren<{
  subtitle: string
  title: string
  toolbar?: ReactNode
}>

export function AppShell({ children, subtitle, title, toolbar }: AppShellProps) {
  return (
    <main className="app-shell app-theme-classic" style={getClassicAppThemeStyle()}>
      <header className="app-shell-header" aria-label="Shell principal MiMIDI">
        <div>
          <span className="app-shell-eyebrow">MiMIDI App Mode</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {toolbar ? <div className="app-shell-toolbar">{toolbar}</div> : null}
      </header>
      <section className="app-shell-workspace">{children}</section>
    </main>
  )
}
