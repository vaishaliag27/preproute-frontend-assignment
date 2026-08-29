import { useEffect, useMemo, useRef, useState } from 'react'

interface Option {
  id: string
  name: string
}

interface MultiSelectProps {
  id?: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  disabledReason?: string
  loading?: boolean
  describedBy?: string
  invalid?: boolean
}

/**
 * Checkbox-list dropdown with a search box and inline chips for the current
 * selection. Used for topics and sub-topics.
 */
export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select options',
  disabled = false,
  disabledReason,
  loading = false,
  describedBy,
  invalid = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.name.toLowerCase().includes(needle))
  }, [options, query])

  const selected = useMemo(
    () => options.filter((option) => value.includes(option.id)),
    [options, value],
  )

  const isDisabled = disabled || loading

  function toggle(optionId: string) {
    onChange(
      value.includes(optionId)
        ? value.filter((item) => item !== optionId)
        : [...value, optionId],
    )
  }

  const summary = loading
    ? 'Loading…'
    : selected.length > 0
      ? `${selected.length} selected`
      : disabled
        ? (disabledReason ?? placeholder)
        : placeholder

  return (
    <div className="multiselect" ref={containerRef}>
      <button
        type="button"
        id={id}
        className={`control multiselect__trigger ${invalid ? 'control--invalid' : ''}`.trim()}
        onClick={() => setOpen((current) => !current)}
        disabled={isDisabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={describedBy}
      >
        <span className={selected.length ? '' : 'multiselect__placeholder'}>{summary}</span>
        <span className="multiselect__caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="multiselect__panel">
          <input
            className="control multiselect__search"
            type="search"
            value={query}
            placeholder="Search…"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Filter options"
          />
          <ul className="multiselect__list" role="listbox" aria-multiselectable="true">
            {filtered.length === 0 && <li className="multiselect__empty">No matches</li>}
            {filtered.map((option) => {
              const checked = value.includes(option.id)
              return (
                <li key={option.id}>
                  <label className="multiselect__option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(option.id)}
                      aria-label={option.name}
                    />
                    <span>{option.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          {value.length > 0 && (
            <button
              type="button"
              className="multiselect__clear"
              onClick={() => onChange([])}
            >
              Clear selection
            </button>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <ul className="chips">
          {selected.map((option) => (
            <li key={option.id} className="chip">
              {option.name}
              <button
                type="button"
                className="chip__remove"
                onClick={() => toggle(option.id)}
                aria-label={`Remove ${option.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
