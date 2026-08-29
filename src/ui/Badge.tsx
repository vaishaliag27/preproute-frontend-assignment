import type { TestStatus } from '../types'

const LABELS: Record<string, { text: string; tone: string }> = {
  live: { text: 'Published', tone: 'success' },
  draft: { text: 'Draft', tone: 'warning' },
  published: { text: 'Published', tone: 'success' },
  scheduled: { text: 'Scheduled', tone: 'warning' },
}

export function StatusBadge({ status }: { status?: TestStatus | string }) {
  const key = typeof status === 'string' ? status.toLowerCase() : ''
  const meta = LABELS[key] ?? { text: 'Incomplete', tone: 'neutral' }
  return <span className={`badge badge--${meta.tone}`}>{meta.text}</span>
}
