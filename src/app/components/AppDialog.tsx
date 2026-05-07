import type { ReactNode } from "react"

type AppDialogProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  actions: ReactNode
  children?: ReactNode
}

export function AppDialog({
  open,
  title,
  description,
  onClose,
  actions,
  children,
}: AppDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="app-dialog-backdrop"
      onClick={onClose}
    >
      <section
        aria-labelledby="app-dialog-title"
        aria-modal="true"
        className="app-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="app-dialog-copy">
          <strong id="app-dialog-title">{title}</strong>
          {description ? <p>{description}</p> : null}
        </div>

        {children}

        <div className="app-dialog-actions">{actions}</div>
      </section>
    </div>
  )
}
