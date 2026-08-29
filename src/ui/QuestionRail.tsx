import { CheckCircleIcon, ChevronsLeftIcon, CircleIcon } from './icons'

export interface RailEntry {
  key: string
  label: string
  done: boolean
}

interface QuestionRailProps {
  entries: RailEntry[]
  /** Index of the question currently open in the editor, if any. */
  activeIndex?: number
  total: number
  collapsed: boolean
  onToggleCollapsed: () => void
  onSelect?: (index: number) => void
}

/** Left-hand list of questions with completion state, as in the Figma. */
export function QuestionRail({
  entries,
  activeIndex,
  total,
  collapsed,
  onToggleCollapsed,
  onSelect,
}: QuestionRailProps) {
  if (collapsed) {
    return (
      <aside className="rail rail--collapsed">
        <button
          type="button"
          className="icon-btn icon-btn--plain"
          onClick={onToggleCollapsed}
          aria-label="Expand question list"
          aria-expanded={false}
          style={{ transform: 'rotate(180deg)' }}
        >
          <ChevronsLeftIcon size={16} />
        </button>
        <span className="rail__vertical">Question creation</span>
      </aside>
    )
  }

  return (
    <aside className="rail">
      <div className="rail__head">
        <span className="rail__title">Question creation</span>
        <button
          type="button"
          className="icon-btn icon-btn--plain"
          onClick={onToggleCollapsed}
          aria-label="Collapse question list"
          aria-expanded
        >
          <ChevronsLeftIcon size={16} />
        </button>
      </div>

      <p className="rail__count">Total Questions . {total}</p>

      <ul className="rail__list">
        {entries.map((entry, index) => {
          const interactive = Boolean(onSelect)
          const className = [
            'rail__item',
            entry.done ? 'rail__item--done' : 'rail__item--pending',
            index === activeIndex ? 'rail__item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')

          const content = (
            <>
              <span className="rail__item-check" aria-hidden="true">
                {entry.done ? <CheckCircleIcon size={14} /> : <CircleIcon size={14} />}
              </span>
              <span className="rail__item-label">{entry.label}</span>
            </>
          )

          return (
            <li key={entry.key}>
              {interactive ? (
                <button
                  type="button"
                  className={className}
                  onClick={() => onSelect?.(index)}
                  aria-current={index === activeIndex ? 'true' : undefined}
                >
                  {content}
                </button>
              ) : (
                <span className={className}>{content}</span>
              )}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
