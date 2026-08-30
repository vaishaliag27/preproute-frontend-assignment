import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { questionsApi, taxonomyApi, testsApi } from '../api'
import { errorMessage, useResource } from '../hooks/useResource'
import { csvToQuestions } from '../lib/csv'
import type { OptionKey, Question, QuestionDraft } from '../types'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { ConfirmDialog, Modal } from '../ui/Modal'
import { TrashIcon, UploadIcon } from '../ui/icons'
import { QuestionRail } from '../ui/QuestionRail'
import { RichTextEditor } from '../ui/RichTextEditor'
import { LoadingBlock } from '../ui/Spinner'
import { ErrorState } from '../ui/States'
import {
  DIFFICULTIES,
  formToPayload,
  testToForm,
  validateTestForm,
} from '../lib/test-form'
import type { TestFormErrors, TestFormState } from '../lib/test-form'
import { TestForm } from '../ui/TestForm'
import { TestSummaryCard } from '../ui/TestSummaryCard'
import { useToast } from '../ui/toast/useToast'
import sampleCsv from '../assets/sample-questions.csv?raw'

const OPTION_KEYS: OptionKey[] = ['option1', 'option2', 'option3', 'option4']

/** A question in the editor; `id` exists only once the API has stored it. */
interface Row {
  localId: string
  id?: string
  data: QuestionDraft
  /** Saved rows edited since loading need a PUT on save. */
  dirty: boolean
}

interface FormState {
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: OptionKey | ''
  explanation: string
  difficulty: string
}

const EMPTY_FORM: FormState = {
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correct_option: '',
  explanation: '',
  difficulty: '',
}

type Errors = Partial<Record<keyof FormState, string>>

let localCounter = 0
const nextLocalId = () => `local-${++localCounter}`

function validate(form: FormState): Errors {
  const errors: Errors = {}

  const text = form.question.trim()
  if (!text) errors.question = 'Question text is required.'
  else if (text.length < 5) errors.question = 'Use at least 5 characters.'

  for (const key of OPTION_KEYS) {
    if (!form[key].trim()) errors[key] = 'This option is required.'
  }

  const filled = OPTION_KEYS.map((key) => form[key].trim().toLowerCase()).filter(Boolean)
  if (filled.length === 4 && new Set(filled).size !== 4) {
    errors.option1 = 'Options must be different from each other.'
  }

  if (!form.correct_option) errors.correct_option = 'Mark which option is correct.'

  return errors
}

function toForm(draft: QuestionDraft): FormState {
  return {
    question: draft.question,
    option1: draft.option1,
    option2: draft.option2,
    option3: draft.option3,
    option4: draft.option4,
    correct_option: draft.correct_option,
    explanation: draft.explanation ?? '',
    difficulty: (draft.difficulty as string) ?? '',
  }
}

function toDraft(form: FormState, testId: string): QuestionDraft {
  return {
    type: 'mcq',
    question: form.question.trim(),
    option1: form.option1.trim(),
    option2: form.option2.trim(),
    option3: form.option3.trim(),
    option4: form.option4.trim(),
    correct_option: form.correct_option as OptionKey,
    explanation: form.explanation.trim() || undefined,
    difficulty: form.difficulty || undefined,
    media_url: null,
    test_id: testId,
  }
}

export function QuestionsPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const test = useResource((signal) => testsApi.get(id, signal), [id])

  const [rows, setRows] = useState<Row[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ row: Row; index: number } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)

  function saveToStorage(questions: Row[], removed: string[]) {
    try {
      localStorage.setItem(`test_${id}_questions`, JSON.stringify(questions))
      localStorage.setItem(`test_${id}_removedIds`, JSON.stringify(removed))
    } catch {
      // Silently fail for private browsing mode
    }
  }

  const [editForm, setEditForm] = useState<TestFormState | null>(null)
  const [editErrors, setEditErrors] = useState<TestFormErrors>({})
  const [editLoading, setEditLoading] = useState(false)
  const [savingTest, setSavingTest] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const questionIds = useMemo(() => test.data?.questions ?? [], [test.data])

  const existingQuestions = useResource(
    (signal) => questionsApi.fetchBulk(questionIds, signal),
    [questionIds.join(',')],
    { enabled: questionIds.length > 0, initialData: [] },
  )

  const subjectId = (test.data?.subject as string) ?? ''

  const subjects = useResource((signal) => taxonomyApi.subjects(signal), [])

  const topics = useResource(
    (signal) => taxonomyApi.topicsBySubject(subjectId, signal),
    [subjectId],
    { enabled: Boolean(subjectId), initialData: [] },
  )

  const testTopicIds = useMemo(
    () => ((test.data?.topics ?? []) as string[]).join(','),
    [test.data],
  )

  const cardSubTopics = useResource(
    (signal) => taxonomyApi.subTopicsByTopics(testTopicIds.split(',').filter(Boolean), signal),
    [testTopicIds],
    { enabled: testTopicIds.length > 0, initialData: [] },
  )

  // Seed the editor from the questions already attached to this test, once.
  const questionsKey = `${id}:${questionIds.join(',')}`
  if (hydratedFor !== questionsKey && test.data) {
    if (questionIds.length === 0) {
      setHydratedFor(questionsKey)
    } else if (!existingQuestions.loading && existingQuestions.data?.length) {
      setHydratedFor(questionsKey)
      setRows(
        existingQuestions.data.map((question: Question) => ({
          localId: nextLocalId(),
          id: question.id,
          data: question,
          dirty: false,
        })),
      )
    }
  }

  const names = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of subjects.data ?? []) map.set(item.id, item.name)
    for (const item of topics.data ?? []) map.set(item.id, item.name)
    for (const item of cardSubTopics.data ?? []) map.set(item.id, item.name)
    return map
  }, [subjects.data, topics.data, cardSubTopics.data])

  const plannedTotal = Number(test.data?.total_questions ?? 0) || rows.length
  const currentNumber = Math.min(
    editingIndex !== null ? editingIndex + 1 : rows.length + 1,
    plannedTotal,
  )

  /** Rail entries pad up to the planned total so pending slots stay visible. */
  const railEntries = useMemo(() => {
    // Show all available rows, but cap display at plannedTotal
    const availableRows = Math.min(rows.length, plannedTotal)
    const entries = rows.slice(0, availableRows).map((row, index) => ({
      key: row.localId,
      label: `Question ${index + 1}`,
      done: true,
    }))
    // Add pending slots for any remaining planned questions
    for (let index = availableRows; index < plannedTotal; index += 1) {
      entries.push({ key: `pending-${index}`, label: `Question ${index + 1}`, done: false })
    }
    return entries
  }, [rows, plannedTotal])

  // Auto-open Question 1 when the test loads
  useEffect(() => {
    if (hydratedFor !== null && editingIndex === null && plannedTotal > 0) {
      setEditingIndex(0)
      setForm(EMPTY_FORM)
      setErrors({})
    }
  }, [hydratedFor, plannedTotal])

  // Load form data when editingIndex changes
  useEffect(() => {
    if (editingIndex !== null && rows[editingIndex]) {
      setForm(toForm(rows[editingIndex].data))
    }
  }, [editingIndex])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditingIndex(null)
  }

  /**
   * Folds the current form into the question list and returns the resulting
   * rows. Returning them (rather than relying on state) lets a save that runs
   * in the same tick see the question that was just committed.
   */
  function commitQuestion(): Row[] | null {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return null
    }

    // Prevent adding more questions than planned
    if (editingIndex === null && rows.length >= plannedTotal) {
      toast.error(`You can only add ${plannedTotal} questions. Delete some or edit the test to increase the limit.`)
      return null
    }

    const draft = toDraft(form, id)

    const next =
      editingIndex !== null && rows[editingIndex]
        ? rows.map((row, index) =>
            index === editingIndex
              ? { ...row, data: { ...draft, id: row.id }, dirty: true }
              : row,
          )
        : [...rows, { localId: nextLocalId(), data: draft, dirty: true }]

    setRows(next)
    // Save to localStorage immediately
    saveToStorage(next, removedIds)
    toast.success(editingIndex !== null ? 'Question updated.' : 'Question added.')
    resetForm()
    return next
  }

  function openQuestion(index: number) {
    const row = rows[index]
    if (!row) {
      // A pending slot: start a fresh question.
      setEditingIndex(index)
      setForm(EMPTY_FORM)
      setErrors({})
      return
    }
    setEditingIndex(index)
    setForm(toForm(row.data))
    setErrors({})
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const { row, index } = pendingDelete
    setRows((current) => current.filter((_, position) => position !== index))
    if (row.id) setRemovedIds((current) => [...current, row.id as string])
    if (editingIndex === index) resetForm()
    setPendingDelete(null)
    toast.info('Question removed. Save to apply the change.')
  }

  async function onCsvSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const { questions } = csvToQuestions(await file.text(), id)
      if (questions.length === 0) {
        toast.error('No usable rows found. Expected columns: question, option1–4, correct_option.')
        return
      }

      // Limit import to planned total
      const available = plannedTotal - rows.length
      const toImport = questions.slice(0, available)
      const excess = questions.length - toImport.length

      if (toImport.length === 0) {
        toast.error(`Cannot import: already at planned limit of ${plannedTotal} questions.`)
        return
      }

      const imported = toImport.map((question) => ({
        localId: nextLocalId(),
        data: question,
        dirty: true,
      }))

      const message = excess > 0
        ? `Imported ${toImport.length}/${questions.length} question(s). Reached planned limit of ${plannedTotal}.`
        : `Imported ${toImport.length} question(s).`

      toast.success(message)

      // Add imported questions and open the first one
      const newRows = [...rows, ...imported]
      setRows(newRows)

      // Save to localStorage immediately
      saveToStorage(newRows, removedIds)

      // Open the first imported question
      const firstImportedIndex = rows.length
      const firstImportedRow = newRows[firstImportedIndex]
      if (firstImportedRow) {
        setEditingIndex(firstImportedIndex)
        setForm(toForm(firstImportedRow.data))
        setErrors({})
        setTimeout(() => {
          editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch {
      toast.error('Could not read that file.')
    }
  }

  async function saveTestDetails() {
    if (!editForm) return
    const nextErrors = validateTestForm(editForm)
    setEditErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSavingTest(true)
    try {
      // Fetch topic/sub-topic IDs to convert names to IDs if needed
      const topicLookup = new Map<string, string>()
      const subTopicLookup = new Map<string, string>()

      if (editForm.topics.length > 0) {
        try {
          const topicsBySubject = await taxonomyApi.topicsBySubject(editForm.subject)
          for (const topic of topicsBySubject) {
            topicLookup.set(topic.name, topic.id)
            topicLookup.set(topic.id, topic.id) // Keep IDs as-is
          }
        } catch {
          // If fetch fails, assume topics are already IDs
        }
      }

      if (editForm.sub_topics.length > 0 && editForm.topics.length > 0) {
        try {
          const subTopics = await taxonomyApi.subTopicsByTopics(editForm.topics)
          for (const subTopic of subTopics) {
            subTopicLookup.set(subTopic.name, subTopic.id)
            subTopicLookup.set(subTopic.id, subTopic.id) // Keep IDs as-is
          }
        } catch {
          // If fetch fails, assume sub_topics are already IDs
        }
      }

      const payload = formToPayload(editForm, (test.data?.status as never) ?? null)

      // Convert topics, preferring lookup but keeping UUIDs as-is
      payload.topics = editForm.topics.map((t) => {
        if (topicLookup.has(t)) return topicLookup.get(t)!
        // If not in lookup and looks like UUID, keep it
        if (t.includes('-')) return t
        // Otherwise return as-is (it might be an ID not in the lookup)
        return t
      })

      // Convert sub_topics similarly
      payload.sub_topics = editForm.sub_topics.map((st) => {
        if (subTopicLookup.has(st)) return subTopicLookup.get(st)!
        // If not in lookup and looks like UUID, keep it
        if (st.includes('-')) return st
        // Otherwise return as-is
        return st
      })

      await testsApi.update(id, payload)
      toast.success('Test details updated.')
      setEditOpen(false)
      test.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSavingTest(false)
    }
  }

function saveAndContinue() {
    // Validate we have at least one question
    let pending = rows
    if (form.question.trim()) {
      const committed = commitQuestion()
      if (!committed) return
      pending = committed
    }
    if (pending.length === 0) {
      toast.error('Add at least one question before continuing.')
      return
    }
    // Store questions temporarily in localStorage before publishing
    saveToStorage(pending, removedIds)
    navigate(`/tests/${id}/publish`)
  }

  if (test.loading) return <LoadingBlock label="Loading test" />
  if (test.error || !test.data) {
    return (
      <div className="page">
        <ErrorState message={test.error ?? 'Test not found.'} onRetry={test.reload} />
      </div>
    )
  }

  const data = test.data
  const hasUnsaved = rows.some((row) => row.dirty) || removedIds.length > 0

  return (
    <div className="page">
      <div className="page__header">
        <Breadcrumbs
          items={[
            { label: 'Test Creation', to: '/dashboard' },
            { label: 'Create Test' },
            { label: 'Question creation' },
          ]}
        />
      </div>

      <div className={`workspace ${railCollapsed ? 'workspace--collapsed' : ''}`.trim()}>
        <QuestionRail
          entries={railEntries}
          activeIndex={editingIndex ?? undefined}
          total={plannedTotal}
          collapsed={railCollapsed}
          onToggleCollapsed={() => setRailCollapsed((value) => !value)}
          onSelect={openQuestion}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TestSummaryCard
            test={data}
            names={names}
            questionCount={plannedTotal}
            onEdit={async () => {
              setEditLoading(true)
              setEditErrors({})

              try {
                const form = testToForm(data)

                // First, convert subject name to ID if needed
                if (form.subject && !form.subject.includes('-')) {
                  const allSubjects = await taxonomyApi.subjects()
                  const subjectMap = new Map(allSubjects.map((s) => [s.name, s.id]))
                  const subjectId = subjectMap.get(form.subject)
                  if (subjectId) {
                    form.subject = subjectId
                  }
                }

                // Convert topic/sub-topic display names to IDs
                if (form.topics.length > 0 && form.subject) {
                  const topicsBySubject = await taxonomyApi.topicsBySubject(form.subject)
                  const topicNameToId = new Map(topicsBySubject.map((t) => [t.name, t.id]))

                  form.topics = form.topics.map((t) => {
                    // If it looks like a UUID (contains dashes), assume it's already an ID
                    if (t.includes('-')) return t
                    // Otherwise, try to look it up by name
                    return topicNameToId.get(t) ?? t
                  })
                }

                if (form.sub_topics.length > 0 && form.topics.length > 0) {
                  const subTopics = await taxonomyApi.subTopicsByTopics(form.topics)
                  const subTopicNameToId = new Map(subTopics.map((st) => [st.name, st.id]))

                  form.sub_topics = form.sub_topics.map((st) => {
                    // If it looks like a UUID (contains dashes), assume it's already an ID
                    if (st.includes('-')) return st
                    // Otherwise, try to look it up by name
                    return subTopicNameToId.get(st) ?? st
                  })
                }

                setEditForm(form)
                setEditOpen(true)
              } catch (error) {
                console.error('Failed to load test data:', error)
                toast.error('Failed to load test for editing. Please try again.')
                setEditForm(null)
              } finally {
                setEditLoading(false)
              }
            }}
          />

          <div className="editor-head" ref={editorRef}>
            <h2 className="editor-head__title">
              Question {currentNumber}
              <span>/{plannedTotal}</span>
            </h2>
            <div className="editor-head__actions">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([sampleCsv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'sample_questions.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                ⬇ Sample
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <UploadIcon size={14} />
                CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onCsvSelected}
                className="sr-only"
                aria-label="Import questions from CSV"
              />
            </div>
          </div>

          <div>
          </div>

          <Field label="Question" error={errors.question} hideLabel>
            {({ describedBy, invalid }) => (
              <div
                className={invalid ? 'field--invalid' : ''}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
              >
                <RichTextEditor
                  value={form.question}
                  onChange={(value) => update('question', value)}
                  placeholder="Type question here..."
                />
              </div>
            )}
          </Field>

          <div className="option-editor">
            <p className="section-label">Type the options below</p>
            {OPTION_KEYS.map((key, index) => (
              <div className="option-editor__row" key={key}>
                <input
                  type="radio"
                  name="correct_option"
                  className="radio-native"
                  checked={form.correct_option === key}
                  onChange={() => update('correct_option', key)}
                  aria-label={`Mark option ${index + 1} as correct`}
                  style={{
                    appearance: 'none',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border-strong)',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    flex: 'none',
                    backgroundColor:
                      form.correct_option === key ? 'var(--brand-text)' : 'transparent',
                    boxShadow:
                      form.correct_option === key
                        ? 'inset 0 0 0 3px var(--bg-elevated)'
                        : undefined,
                    borderColor:
                      form.correct_option === key ? 'var(--brand-text)' : undefined,
                  }}
                />
                <input
                  className={`control ${errors[key] ? 'control--invalid' : ''}`.trim()}
                  type="text"
                  placeholder="Type Option here"
                  value={form[key]}
                  onChange={(event) => update(key, event.target.value)}
                  aria-label={`Option ${index + 1}`}
                  aria-invalid={Boolean(errors[key]) || undefined}
                />
                <button
                  type="button"
                  className="option-editor__delete"
                  onClick={() => update(key, '')}
                  disabled={!form[key]}
                  aria-label={`Clear option ${index + 1}`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ))}
            {(errors.option1 ||
              errors.option2 ||
              errors.option3 ||
              errors.option4 ||
              errors.correct_option) && (
              <p className="field__error" role="alert">
                {errors.correct_option ??
                  errors.option1 ??
                  errors.option2 ??
                  errors.option3 ??
                  errors.option4}
              </p>
            )}
          </div>

          <div>
            <p className="section-label" style={{ marginBottom: 'var(--space-2)' }}>
              Add Solution
            </p>
            <textarea
              className="control"
              value={form.explanation}
              onChange={(e) => update('explanation', e.target.value)}
              placeholder="Explain the correct answer (optional)"
              rows={3}
            />
          </div>

          <div>
            <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
              Question settings
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Field label="Level of Difficulty">
                {({ id: fieldId }) => (
                  <select
                    id={fieldId}
                    className="control"
                    value={form.difficulty}
                    onChange={(event) => update('difficulty', event.target.value)}
                  >
                    <option value="">Select from Drop-down</option>
                    {DIFFICULTIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

            </div>
          </div>


          <div className="page__footer">
            <Button variant="danger" onClick={() => setConfirmExit(true)}>
              Exit Test Creation
            </Button>
            <Button onClick={() => {
              if (editingIndex === null || editingIndex >= plannedTotal - 1) {
                void saveAndContinue()
              } else {
                // Capture current index before commitQuestion resets it
                const currentIndex = editingIndex ?? 0
                const saved = commitQuestion()
                if (saved) {
                  openQuestion(currentIndex + 1)
                }
              }
            }}>
              {editingIndex === null || editingIndex >= plannedTotal - 1 ? 'Continue to Publish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Edit Test creation"
        onClose={() => {
          setEditOpen(false)
          setEditForm(null)
        }}
        busy={savingTest || editLoading}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditOpen(false)
                setEditForm(null)
              }}
              disabled={savingTest || editLoading}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveTestDetails()} loading={savingTest} disabled={editLoading}>
              Save
            </Button>
          </>
        }
      >
        {editLoading ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--fg-secondary)' }}>
            Loading test details...
          </div>
        ) : editForm ? (
          <TestForm
            form={editForm}
            errors={editErrors}
            onChange={setEditForm}
            onErrorsChange={setEditErrors}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove this question?"
        description="It will be detached from the test when you save."
        confirmLabel="Remove"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Delete all edits?"
        description="Every question added in this session and the current draft will be cleared. Questions already saved to the test stay on the server until you save again."
        confirmLabel="Delete all"
        destructive
        onConfirm={() => {
          setRemovedIds((current) => [
            ...current,
            ...rows.filter((row) => row.id).map((row) => row.id as string),
          ])
          setRows([])
          resetForm()
          setConfirmClear(false)
          toast.info('All edits cleared.')
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmExit}
        title="Exit test creation?"
        description={
          hasUnsaved
            ? 'You have unsaved questions. Leaving now discards them.'
            : 'You can come back and continue from the dashboard.'
        }
        confirmLabel="Exit"
        destructive
        onConfirm={() => navigate('/dashboard')}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  )
}
