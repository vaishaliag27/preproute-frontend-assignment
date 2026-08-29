import type { Test } from '../types'
import { DASH } from '../lib/format'
import { AwardIcon, ClockIcon, FileIcon, LeafIcon, PencilIcon } from './icons'
import { DIFFICULTIES, TEST_TYPES } from '../lib/test-form'

interface TestSummaryCardProps {
  test: Test
  /** id → display name for subjects, topics and sub-topics. */
  names: Map<string, string>
  questionCount: number
  onEdit?: () => void
}

function labelFor(list: { value: string; label: string }[], value?: string) {
  const key = String(value ?? '').toLowerCase()
  return list.find((item) => item.value === key)?.label
}

/** The dark-badge summary card shown above the question editor and publish steps. */
export function TestSummaryCard({
  test,
  names,
  questionCount,
  onEdit,
}: TestSummaryCardProps) {
  const typeLabel = labelFor(TEST_TYPES, test.type as string) ?? 'Chapterwise'
  const difficultyLabel = labelFor(DIFFICULTIES, test.difficulty as string) ?? 'Easy'

  const subject =
    names.get(String(test.subject)) ?? (test.subject as string) ?? DASH
  const topics = ((test.topics ?? []) as string[]).map((id) => names.get(id) ?? id)
  const subTopics = ((test.sub_topics ?? []) as string[]).map((id) => names.get(id) ?? id)

  return (
    <section className="card summary-card" aria-label="Test summary">
      {onEdit && (
        <button
          type="button"
          className="icon-btn icon-btn--plain summary-card__edit"
          onClick={onEdit}
          aria-label="Edit test details"
          title="Edit test details"
        >
          <PencilIcon size={16} />
        </button>
      )}

      <div>
        <span className="badge badge--type">{typeLabel}</span>
      </div>

      <div className="summary-card__title-row">
        <h2 className="summary-card__name">{test.name}</h2>
        <span className="badge badge--difficulty">
          <LeafIcon size={12} />
          {difficultyLabel}
        </span>
      </div>

      <div className="summary-card__body">
        <dl className="summary-card__facts">
          <div className="summary-card__fact">
            <dt>Subject</dt>
            <span aria-hidden="true">:</span>
            <dd>{subject}</dd>
          </div>
          <div className="summary-card__fact">
            <dt>Topic</dt>
            <span aria-hidden="true">:</span>
            <dd>
              {topics.length === 0 ? (
                DASH
              ) : (
                topics.map((name) => (
                  <span className="tag" key={name}>
                    {name}
                  </span>
                ))
              )}
            </dd>
          </div>
          <div className="summary-card__fact">
            <dt>Sub Topic</dt>
            <span aria-hidden="true">:</span>
            <dd>
              {subTopics.length === 0 ? (
                DASH
              ) : (
                subTopics.map((name) => (
                  <span className="tag" key={name}>
                    {name}
                  </span>
                ))
              )}
            </dd>
          </div>
        </dl>

        <div className="summary-card__meta">
          <span className="pill">
            <ClockIcon size={13} />
            {test.total_time ?? 0} Min
          </span>
          <span className="pill">
            <FileIcon size={13} />
            {questionCount || test.total_questions || 0} Q&apos;s
          </span>
          <span className="pill">
            <AwardIcon size={13} />
            {test.total_marks ?? 0} Marks
          </span>
        </div>
      </div>
    </section>
  )
}
