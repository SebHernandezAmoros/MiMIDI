type PluginsWorkspaceProps = {
  body: string
  title: string
}

export function PluginsWorkspace({ body, title }: PluginsWorkspaceProps) {
  return (
    <section className="app-view-panel app-view-panel-feature" aria-label="Workspace Plugins">
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  )
}
