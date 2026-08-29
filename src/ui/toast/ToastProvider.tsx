import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './context'
import type { ToastTone } from './context'

interface Toast {
  id: number
  tone: ToastTone
  message: string
}

const DISMISS_AFTER_MS = 4500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, tone, message }])
      timers.current.push(window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS))
    },
    [dismiss],
  )

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const api = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div className="toasts" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <output key={toast.id} className={`toast toast--${toast.tone}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </output>
        ))}
      </div>
    </ToastContext>
  )
}
