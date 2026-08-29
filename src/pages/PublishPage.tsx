import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { questionsApi, taxonomyApi, testsApi } from '../api'
import { errorMessage, useResource } from '../hooks/useResource'
import { sanitizeHtml } from '../lib/sanitize'
import type { OptionKey, Question, QuestionDraft, TestUpdate } from '../types'
import { Breadcrumbs } from '../ui/Breadcrumbs'

interface Row {
  localId: string
  id?: string
  data: QuestionDraft
  dirty: boolean
}
import { Button } from '../ui/Button'
import { CalendarIcon, CheckCircleIcon } from '../ui/icons'
import { ConfirmDialog } from '../ui/Modal'
import { RadioGroup } from '../ui/RadioGroup'
import { LoadingBlock } from '../ui/Spinner'
import { EmptyState, ErrorState } from '../ui/States'
import { TestSummaryCard } from '../ui/TestSummaryCard'
import { useToast } from '../ui/toast/useToast'

const OPTION_KEYS: OptionKey[] = ['option1', 'option2', 'option3', 'option4']

type LiveUntil = 'always' | '1w' | '2w' | '3w' | '1m' | 'custom'

const LIVE_OPTIONS: { value: LiveUntil; label: string }[] = [
  { value: 'always', label: 'Always Available' },
  { value: '3w', label: '3 Weeks' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '2w', label: '2 Weeks' },
  { value: 'custom', label: 'Custom Duration' },
]

const DAYS: Partial<Record<LiveUntil, number>> = { '1w': 7, '2w': 14, '3w': 21, '1m': 30 }

/** Turns the chosen preset into an ISO end date, or null for "always". */
function resolveLiveUntil(
  choice: LiveUntil,
  endDate: string,
  endTime: string,
  from: Date,
): string | null {
  if (choice === 'always') return null
  if (choice === 'custom') {
    if (!endDate) return null
    return new Date(`${endDate}T${endTime || '23:59'}`).toISOString()
  }
  const days = DAYS[choice] ?? 0
  const end = new Date(from)
  end.setDate(end.getDate() + days)
  return end.toISOString()
}

export function PublishPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()

  // Check if in view-only mode
  const isViewOnly = searchParams.get('mode') === 'view'

  // Retrieve questions from localStorage
  const questionsToSave = JSON.parse(localStorage.getItem(`test_${id}_questions`) || '[]')
  const removedIds = JSON.parse(localStorage.getItem(`test_${id}_removedIds`) || '[]')

  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [liveUntil, setLiveUntil] = useState<LiveUntil>('always')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const test = useResource((signal) => testsApi.get(id, signal), [id])
  const subjects = useResource((signal) => taxonomyApi.subjects(signal), [])

  const subjectId = (test.data?.subject as string) ?? ''
  const topics = useResource(
    (signal) => taxonomyApi.topicsBySubject(subjectId, signal),
    [subjectId],
    { enabled: Boolean(subjectId), initialData: [] },
  )

  const topicIds = useMemo(() => (test.data?.topics ?? []) as string[], [test.data])
  const subTopics = useResource(
    (signal) => taxonomyApi.subTopicsByTopics(topicIds, signal),
    [topicIds.join(',')],
    { enabled: topicIds.length > 0, initialData: [] },
  )

  const questionIds = useMemo(() => test.data?.questions ?? [], [test.data])
  const questions = useResource(
    (signal) => questionsApi.fetchBulk(questionIds, signal),
    [questionIds.join(',')],
    { enabled: questionIds.length > 0, initialData: [] },
  )

  const names = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of subjects.data ?? []) map.set(item.id, item.name)
    for (const item of topics.data ?? []) map.set(item.id, item.name)
    for (const item of subTopics.data ?? []) map.set(item.id, item.name)
    return map
  }, [subjects.data, topics.data, subTopics.data])

  if (test.loading) return <LoadingBlock label="Loading test" />
  if (test.error || !test.data) {
    return (
      <div className="page">
        <ErrorState message={test.error ?? 'Test not found.'} onRetry={test.reload} />
      </div>
    )
  }

  const data = test.data
  const rows = questions.data ?? []
  // Combine existing questions with new ones from localStorage
  // Normalize so all have the same structure with direct question properties
  const allRows = [...rows, ...questionsToSave.filter((q: Row) => !q.id)].map((q: Row | Question): QuestionDraft | Question =>
    (q as Row).data ? (q as Row).data : (q as Question)
  )
  const isPublished = String(data.status).toLowerCase() === 'live'
  const plannedTotal = Number(data.total_questions ?? 0) || allRows.length
  const allDone = allRows.length > 0 && allRows.length >= plannedTotal

  function validateSchedule(): string | null {
    if (mode === 'schedule' && !startDate) return 'Choose the date this test goes live.'
    if (liveUntil === 'custom' && !endDate) return 'Choose the date this test stops being available.'
    if (mode === 'schedule' && liveUntil === 'custom' && startDate && endDate) {
      const start = new Date(`${startDate}T${startTime || '00:00'}`)
      const end = new Date(`${endDate}T${endTime || '23:59'}`)
      if (end <= start) return 'The end date must be after the start date.'
    }
    return null
  }

  async function saveQuestions(): Promise<Map<string, string>> {
    const idByLocalId = new Map<string, string>()

    if (questionsToSave.length === 0) return idByLocalId

    try {
      // Save new questions
      const newRows = questionsToSave.filter((row: Row) => !row.id)
      if (newRows.length > 0) {
        const questionsToCreate = newRows.map((row: Row) => {
          const payload = {
            ...row.data,
            subject: data?.subject as string,
            topic: row.data.topic || undefined,
            sub_topic: row.data.sub_topic || undefined,
          }
          // Remove null/undefined fields
          Object.keys(payload).forEach((key) => {
            if (payload[key as keyof typeof payload] === null || payload[key as keyof typeof payload] === undefined) {
              delete payload[key as keyof typeof payload]
            }
          })
          return payload
        })

        const created = await questionsApi.bulkCreate(questionsToCreate)
        newRows.forEach((row: Row, index: number) => idByLocalId.set(row.localId, created[index].id))
      }

      // Update existing questions
      for (const row of questionsToSave.filter((item: Row) => item.id && item.dirty)) {
        try {
          await questionsApi.update(row.id as string, row.data)
        } catch {
          // Non-fatal
        }
      }

      // Remove deleted questions
      for (const removedId of removedIds) {
        try {
          await questionsApi.remove(removedId)
        } catch {
          // Non-fatal
        }
      }
    } catch (error) {
      throw new Error(`Failed to save questions: ${errorMessage(error)}`)
    }

    return idByLocalId
  }

  async function publish() {
    try {
      // First, save any pending questions
      const idByLocalId = await saveQuestions()

      // Update question list on test
      const orderedIds = questionsToSave.map((row: Row) => row.id ?? idByLocalId.get(row.localId) ?? '')

      const start =
        mode === 'schedule'
          ? new Date(`${startDate}T${startTime || '00:00'}`)
          : new Date()

      const payload: TestUpdate = {
        status: mode === 'schedule' ? 'scheduled' : 'live',
        scheduled_at: mode === 'schedule' ? start.toISOString() : null,
        live_until: resolveLiveUntil(liveUntil, endDate, endTime, start),
        live_duration: liveUntil,
        questions: orderedIds,
        total_questions: orderedIds.length,
        total_marks: orderedIds.length * Number(data?.correct_marks ?? 0),
      }

      await testsApi.update(id, payload)
      // Clear localStorage
      localStorage.removeItem(`test_${id}_questions`)
      localStorage.removeItem(`test_${id}_removedIds`)
      setConfirmOpen(false)
      toast.success(
        mode === 'schedule'
          ? `"${data.name}" is scheduled to go live.`
          : `"${data.name}" is now live.`,
      )
      navigate('/dashboard')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="page">
      {!isViewOnly && (
        <Breadcrumbs
          items={[
            { label: 'Test Creation', to: '/dashboard' },
            { label: 'Create Test' },
            { label: 'Publish' },
          ]}
        />
      )}

      <div className="publish">
          {!isViewOnly && (
            <>
              <h1 className="page__title">Test creation</h1>

              <div className="publish__status">
                <h2>Test created</h2>
                <span className="badge badge--done">
                  <CheckCircleIcon size={13} />
                  {allDone
                    ? `All ${allRows.length} Questions done`
                    : `${allRows.length} of ${plannedTotal} Questions done`}
                </span>
              </div>
            </>
          )}

          <TestSummaryCard
            test={data}
            names={names}
            questionCount={rows.length}
          />

          {/* Not in the Figma: the brief asks for the full question list on this
              step, so it is available here without crowding the publish flow. */}
          <details className="disclosure" open={isViewOnly}>
            <summary className="disclosure__summary">
              <span>
                Review all questions <span className="counter">{allRows.length}</span>
              </span>
              <span className="crumbs__sep">Show / hide</span>
            </summary>
            <div className="disclosure__body">
              {questions.loading && <LoadingBlock label="Loading questions" />}
              {questions.error && (
                <ErrorState message={questions.error} onRetry={questions.reload} />
              )}
              {!questions.loading && !questions.error && allRows.length === 0 && (
                <EmptyState
                  title="This test has no questions yet"
                  description="A test needs at least one question before it can be published."
                  action={
                    <Button onClick={() => navigate(`/tests/${id}/questions`)}>
                      Add questions
                    </Button>
                  }
                />
              )}
              <ol className="question-list">
                {allRows.map((question, index) => (
                  <li className="question-card" key={question.id || (question as any).localId || index}>
                    <div className="question-card__head">
                      <span className="question-card__index">Q{index + 1}</span>
                      <div
                        className="question-card__text"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(question.question),
                        }}
                      />
                        </div>
                    {question.media_url && (
                      <img
                        className="question-card__media"
                        src={question.media_url}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <ul className="question-card__options">
                      {OPTION_KEYS.map((key, optionIndex) => (
                        <li
                          key={key}
                          className={
                            question.correct_option === key
                              ? 'option option--correct'
                              : 'option'
                          }
                        >
                          <span className="option__letter">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{question[key]}</span>
                          {question.correct_option === key && (
                            <span className="option__tag">Correct</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {question.explanation && (
                      <div className="question-card__foot">
                        <div
                          className="question-card__explanation"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(`<strong>Solution: </strong>${question.explanation}`),
                          }}
                        />
                          </div>
                    )}
                  </li>
                ))}
              </ol>
                </div>
          </details>

          {!isViewOnly && (
            <>
              <div className="tabs" role="tablist" aria-label="Publishing mode">
                <button
                  type="button"
                  role="tab"
                  className="tabs__item"
                  aria-selected={mode === 'now'}
                  onClick={() => setMode('now')}
                >
                  Publish Now
                </button>
                <button
                  type="button"
                  role="tab"
                  className="tabs__item"
                  aria-selected={mode === 'schedule'}
                  onClick={() => setMode('schedule')}
                >
                  Schedule Publish
                </button>
              </div>

              {mode === 'schedule' && (
                <div>
                  <p className="publish__section-title">Select Date and Time</p>
                  <div className="form-grid" style={{ marginTop: 'var(--space-3)' }}>
                    <div className="date-field">
                      <input
                        className="control"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        aria-label="Publish date"
                      />
                      <CalendarIcon size={16} />
                    </div>
                    <select
                      className="control"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      aria-label="Publish time"
                    >
                      <option value="">Select Time</option>
                      {Array.from({ length: 48 }, (_, index) => {
                        const hour = String(Math.floor(index / 2)).padStart(2, '0')
                        const minute = index % 2 === 0 ? '00' : '30'
                        return `${hour}:${minute}`
                      }).map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <p className="publish__section-title">Live Until</p>
                <p className="publish__hint" style={{ marginBottom: 'var(--space-3)' }}>
                  Choose how long this test should remain available on the platform.
                </p>
                <RadioGroup
                  name="live-until"
                  legend="Live until"
                  options={LIVE_OPTIONS}
                  value={liveUntil}
                  onChange={setLiveUntil}
                  grid
                />
              </div>

              <div className="form-grid">
                <div className="date-field">
                  <input
                    className="control"
                    type="date"
                    value={endDate}
                    disabled={liveUntil !== 'custom'}
                    onChange={(event) => setEndDate(event.target.value)}
                    aria-label="End date"
                  />
                  <CalendarIcon size={16} />
                </div>
                <select
                  className="control"
                  value={endTime}
                  disabled={liveUntil !== 'custom'}
                  onChange={(event) => setEndTime(event.target.value)}
                  aria-label="End time"
                >
                  <option value="">Select End Time</option>
                  {Array.from({ length: 48 }, (_, index) => {
                    const hour = String(Math.floor(index / 2)).padStart(2, '0')
                    const minute = index % 2 === 0 ? '00' : '30'
                    return `${hour}:${minute}`
                  }).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="alert alert--error" role="alert">
                  {formError}
                </div>
              )}

              <div className="form-actions">
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const problem = validateSchedule()
                    setFormError(problem)
                    if (!problem) setConfirmOpen(true)
                  }}
                  disabled={(rows.length === 0 && questionsToSave.length === 0) || isPublished}
                  title={
                    isPublished
                      ? 'This test is already live'
                      : rows.length === 0 && questionsToSave.length === 0
                        ? 'Add at least one question first'
                        : undefined
                  }
                >
                  {isPublished ? 'Already live' : 'Confirm'}
                </Button>
              </div>
            </>
          )}

          <ConfirmDialog
            open={confirmOpen}
            title={mode === 'schedule' ? 'Schedule this test?' : 'Publish this test?'}
            description={
              (() => {
                const totalQuestions = rows.length + questionsToSave.length
                const baseMsg = `"${data.name}" will become visible to students with ${totalQuestions} question(s).`
                if (mode === 'schedule') {
                  return `"${data.name}" will go live on ${startDate} at ${startTime || '00:00'} with ${totalQuestions} question(s).`
                }
                return baseMsg
              })()
            }
            confirmLabel={mode === 'schedule' ? 'Schedule' : 'Publish'}
            onConfirm={() => void publish()}
            onCancel={() => setConfirmOpen(false)}
          />
      </div>
    </div>
  )
}
