const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const DASH = '—'

export function formatDate(value?: string | null): string {
  if (!value) return DASH
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? DASH : DATE_FORMAT.format(date)
}

export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return DASH
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`
}

export function titleCase(value?: string | null): string {
  if (!value) return DASH
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

/** Renders a list field such as `topics`, which may hold ids or resolved names. */
export function joinNames(
  values: (string | undefined)[] | undefined,
  lookup?: Map<string, string>,
): string {
  if (!values?.length) return DASH
  const names = values
    .map((value) => (value ? (lookup?.get(value) ?? value) : ''))
    .filter(Boolean)
  return names.length ? names.join(', ') : DASH
}
