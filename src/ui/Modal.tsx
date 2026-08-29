import { useEffect, useRef } from 'react'
import { Button } from './Button'
import { CloseIcon } from './icons'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md'
  /** Blocks closing while a request is in flight. */
  busy?: boolean
}

/** Native <dialog> modal: backdrop, Escape handling and focus trapping for free. */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  busy = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="modal__positioner">
        <div className={`modal__panel ${size === 'sm' ? 'modal__panel--sm' : ''}`.trim()}>
          <div className="modal__head">
            <h2 className="modal__title">{title}</h2>
            <button
              type="button"
              className="icon-btn icon-btn--plain"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              <CloseIcon size={17} />
            </button>
          </div>
          {children}
          {footer && <div className="modal__actions">{footer}</div>}
        </div>
      </div>
    </dialog>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      busy={busy}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="modal__body">{description}</p>}
    </Modal>
  )
}
