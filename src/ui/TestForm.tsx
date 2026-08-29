import { useMemo } from 'react'
import { taxonomyApi } from '../api'
import { useResource } from '../hooks/useResource'
import {
  DIFFICULTIES,
  TEST_TYPES,
  totalMarksFor,
} from '../lib/test-form'
import type { TestFormErrors, TestFormState } from '../lib/test-form'
import { Field } from './Field'
import { MultiSelect } from './MultiSelect'
import { NumberStepper } from './NumberStepper'
import { RadioGroup } from './RadioGroup'
import { ErrorState } from './States'

interface TestFormProps {
  form: TestFormState
  errors: TestFormErrors
  onChange: (form: TestFormState) => void
  onErrorsChange: (errors: TestFormErrors) => void
  loadingTopics?: boolean
}

/**
 * The test creation form body, shared by the full-page create/edit screen and
 * the "Edit Test creation" modal.
 */
export function TestForm({ form, errors, onChange, onErrorsChange, loadingTopics }: TestFormProps) {
  const subjects = useResource((signal) => taxonomyApi.subjects(signal), [])

  const topics = useResource(
    (signal) => taxonomyApi.topicsBySubject(form.subject, signal),
    [form.subject],
    { enabled: Boolean(form.subject), initialData: [] },
  )

  const subTopics = useResource(
    (signal) => taxonomyApi.subTopicsByTopics(form.topics, signal),
    [form.topics.join(',')],
    { enabled: form.topics.length > 0, initialData: [] },
  )

  const topicOptions = useMemo(() => topics.data ?? [], [topics.data])
  const subTopicOptions = useMemo(() => subTopics.data ?? [], [subTopics.data])

  function update<K extends keyof TestFormState>(key: K, value: TestFormState[K]) {
    onChange({ ...form, [key]: value })
    onErrorsChange({ ...errors, [key]: undefined })
  }

  function onSubjectChange(subjectId: string) {
    // Topics and sub-topics belong to the previous subject, so drop them.
    onChange({ ...form, subject: subjectId, topics: [], sub_topics: [] })
    onErrorsChange({ ...errors, subject: undefined, topics: undefined })
  }

  function onTopicsChange(nextTopics: string[]) {
    const stillValid = new Set(
      subTopicOptions
        .filter((item) => nextTopics.includes(item.topic_id ?? ''))
        .map((item) => item.id),
    )
    onChange({
      ...form,
      topics: nextTopics,
      // Keep sub-topics whose parent is still selected. Ids whose parent has
      // not been fetched yet are kept so editing does not silently drop them.
      sub_topics: form.sub_topics.filter((subTopicId) => {
        const known = subTopicOptions.find((item) => item.id === subTopicId)
        return known ? stillValid.has(subTopicId) : true
      }),
    })
    onErrorsChange({ ...errors, topics: undefined })
  }

  const totalMarks = totalMarksFor(form)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="segmented" role="group" aria-label="Test type">
        {TEST_TYPES.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segmented__item"
            aria-pressed={form.type === option.value}
            onClick={() => update('type', option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {subjects.error && <ErrorState message={subjects.error} onRetry={subjects.reload} />}

      <div className="form-grid">
        <Field label="Subject" error={errors.subject}>
          {({ id, describedBy, invalid }) => (
            <select
              id={id}
              className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
              value={form.subject}
              onChange={(event) => onSubjectChange(event.target.value)}
              disabled={subjects.loading}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            >
              <option value="">
                {subjects.loading ? 'Loading…' : 'Choose from Drop-down'}
              </option>
              {(subjects.data ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Name of Test" error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
              type="text"
              placeholder="Enter name of Test"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </Field>

        <Field label="Topic" error={topics.loading || loadingTopics ? undefined : (errors.topics ?? topics.error ?? undefined)}>
          {({ id, describedBy, invalid }) => (
            <MultiSelect
              id={id}
              options={topicOptions}
              value={form.topics}
              onChange={onTopicsChange}
              disabled={!form.subject || topics.loading || loadingTopics}
              disabledReason={loadingTopics ? 'Loading topics…' : (topics.loading ? 'Loading topics…' : 'Choose a subject first')}
              loading={topics.loading || loadingTopics}
              describedBy={describedBy}
              invalid={invalid && !topics.loading && !loadingTopics}
              placeholder="Choose from Drop-down"
            />
          )}
        </Field>

        <Field label="Sub Topic" error={subTopics.loading || loadingTopics ? undefined : (subTopics.error ?? undefined)}>
          {({ id, describedBy }) => (
            <MultiSelect
              id={id}
              options={subTopicOptions}
              value={form.sub_topics}
              onChange={(value) => update('sub_topics', value)}
              disabled={form.topics.length === 0 || subTopics.loading || loadingTopics}
              disabledReason={loadingTopics ? 'Loading sub-topics…' : (subTopics.loading ? 'Loading sub-topics…' : 'Choose a topic first')}
              loading={subTopics.loading || loadingTopics}
              describedBy={describedBy}
              placeholder="Choose from Drop-down"
            />
          )}
        </Field>

        <Field label="Duration (Minutes)" error={errors.total_time}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
              type="number"
              min="1"
              placeholder="Enter the time"
              value={form.total_time}
              onChange={(event) => update('total_time', event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </Field>

        <div className="field">
          <span className="field__label">Test Difficulty Level</span>
          <RadioGroup
            name="difficulty"
            legend="Test difficulty level"
            options={DIFFICULTIES}
            value={form.difficulty}
            onChange={(value) => update('difficulty', value)}
          />
        </div>
      </div>

      <div>
        <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
          Marking Scheme:
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 'var(--space-4)',
            alignItems: 'start',
          }}
        >
          <Field label="Wrong Answer" error={errors.wrong_marks}>
            {({ id, describedBy, invalid }) => (
              <NumberStepper
                id={id}
                value={form.wrong_marks}
                onChange={(value) => update('wrong_marks', value)}
                max={0}
                signed
                describedBy={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Unattempted" error={errors.unattempt_marks}>
            {({ id, describedBy, invalid }) => (
              <NumberStepper
                id={id}
                value={form.unattempt_marks}
                onChange={(value) => update('unattempt_marks', value)}
                signed
                describedBy={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Correct Answer" error={errors.correct_marks}>
            {({ id, describedBy, invalid }) => (
              <NumberStepper
                id={id}
                value={form.correct_marks}
                onChange={(value) => update('correct_marks', value)}
                min={0}
                signed
                describedBy={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="No of Questions" error={errors.total_questions}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
                type="number"
                min="1"
                placeholder="Ex:250 Marks"
                value={form.total_questions}
                onChange={(event) => update('total_questions', event.target.value)}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
              />
            )}
          </Field>

          <Field label="Total Marks" hint="Questions × correct answer marks.">
            {({ id, describedBy }) => (
              <input
                id={id}
                className="control"
                type="text"
                readOnly
                disabled
                placeholder="Ex:250 Marks"
                value={totalMarks > 0 ? `${totalMarks} Marks` : ''}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </div>
      </div>
    </div>
  )
}
