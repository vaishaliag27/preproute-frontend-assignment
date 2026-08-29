import { useId } from 'react'
import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  /** Keeps the label for assistive tech but removes it visually. */
  hideLabel?: boolean
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** Label + hint + error shell shared by every form control. */
export function Field({
  label,
  error,
  hint,
  required,
  hideLabel = false,
  children,
}: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field ${error ? 'field--invalid' : ''}`.trim()}>
      <label className={hideLabel ? 'sr-only' : 'field__label'} htmlFor={id}>
        {label}
        {required && !hideLabel && (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
