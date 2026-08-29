interface Option<T extends string> {
  value: T
  label: string
}

interface RadioGroupProps<T extends string> {
  name: string
  legend: string
  options: Option<T>[]
  value: T | ''
  onChange: (value: T) => void
  /** Two-column grid instead of a single row. */
  grid?: boolean
  hideLegend?: boolean
}

export function RadioGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  grid = false,
  hideLegend = true,
}: RadioGroupProps<T>) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend className={hideLegend ? 'sr-only' : 'field__label'}>{legend}</legend>
      <div className={grid ? 'radio-grid' : 'radio-row'}>
        {options.map((option) => (
          <label className="radio" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
