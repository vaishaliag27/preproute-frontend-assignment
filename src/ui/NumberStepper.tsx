interface NumberStepperProps {
  id?: string
  value: string
  onChange: (value: string) => void
  step?: number
  min?: number
  max?: number
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  /** Renders "+5" style values, matching the marking-scheme design. */
  signed?: boolean
}

/** Number input with the stacked up/down arrows used by the marking scheme. */
export function NumberStepper({
  id,
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
  disabled = false,
  invalid = false,
  describedBy,
  signed = false,
}: NumberStepperProps) {
  function nudge(direction: 1 | -1) {
    const current = Number(value)
    const base = Number.isFinite(current) ? current : 0
    let next = Math.round((base + direction * step) * 100) / 100
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(signed && next > 0 ? `+${next}` : String(next))
  }

  return (
    <div
      className={`stepper-input ${invalid ? 'stepper-input--invalid' : ''}`.trim()}
      aria-disabled={disabled || undefined}
    >
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
      />
      <span className="stepper-input__arrows">
        <button
          type="button"
          className="stepper-input__arrow"
          onClick={() => nudge(1)}
          disabled={disabled}
          aria-label="Increase"
        >
          ▲
        </button>
        <button
          type="button"
          className="stepper-input__arrow"
          onClick={() => nudge(-1)}
          disabled={disabled}
          aria-label="Decrease"
        >
          ▼
        </button>
      </span>
    </div>
  )
}
