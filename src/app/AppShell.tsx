import type { PropsWithChildren, ReactNode } from "react"
import { getClassicAppThemeStyle } from "./appTheme"

type AppShellProps = PropsWithChildren<{
  subtitle: string
  title: string
  toolbar?: ReactNode
}>

export function AppShell({ children, subtitle, title, toolbar }: AppShellProps) {
  void subtitle
  void toolbar

  return (
    <main className="app-shell app-theme-classic" style={getClassicAppThemeStyle()}>
      <section className="app-shell-portrait-blocker" aria-label="Modo vertical no disponible">
        <strong>{title}</strong>
        <p>Gira el dispositivo a horizontal para usar esta vista.</p>
      </section>

      <div className="app-shell-live-content">
        <section className="app-shell-workspace">{children}</section>
      </div>
    </main>
  )
}
