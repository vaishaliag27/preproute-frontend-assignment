import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { taxonomyApi, testsApi } from '../api'
import { errorMessage, useResource } from '../hooks/useResource'
import type { Test, TestStatus } from '../types'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { Button } from '../ui/Button'
import { LoadingBlock } from '../ui/Spinner'
import { ErrorState } from '../ui/States'
import {
  EMPTY_TEST_FORM,
  formToPayload,
  TEST_TYPES,
  testToForm,
  validateTestForm,
} from '../lib/test-form'
import type { TestFormErrors, TestFormState } from '../lib/test-form'
import { TestForm } from '../ui/TestForm'
import { useToast } from '../ui/toast/useToast'

export function TestFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState<TestFormState>(EMPTY_TEST_FORM)
  const [errors, setErrors] = useState<TestFormErrors>({})
  const [saving, setSaving] = useState<'draft' | 'next' | null>(null)
  const [existing, setExisting] = useState<Test | null>(null)
  const [loadingTopics, setLoadingTopics] = useState(false)

  const test = useResource((signal) => testsApi.get(id as string, signal), [id], {
    enabled: isEdit,
  })

  // Hydrate during render rather than in an effect, so the empty form never flashes.
  if (test.data && test.data.id !== existing?.id) {
    setExisting(test.data)
    setForm(testToForm(test.data))
  }

  // Convert topic/sub-topic names to IDs when form is hydrated
  useEffect(() => {
    if (!existing || !form.subject) return

    setLoadingTopics(true)
    ;(async () => {
      try {
        let subjectId = form.subject

        // Convert subject name to ID if needed
        if (!subjectId.includes('-')) {
          const allSubjects = await taxonomyApi.subjects()
          const subjectMap = new Map(allSubjects.map((s) => [s.name, s.id]))
          const converted = subjectMap.get(form.subject)
          if (converted) {
            subjectId = converted
          }
        }

        let convertedTopics = form.topics
        // Convert topic names to IDs if needed
        if (form.topics.length > 0) {
          const topicsBySubject = await taxonomyApi.topicsBySubject(subjectId)
          const topicNameToId = new Map(topicsBySubject.map((t) => [t.name, t.id]))
          convertedTopics = form.topics.map((t) => {
            if (t.includes('-')) return t // Already an ID
            return topicNameToId.get(t) ?? t
          })
        }

        let convertedSubTopics = form.sub_topics
        // Convert sub-topic names to IDs if needed
        if (form.sub_topics.length > 0 && convertedTopics.length > 0) {
          const subTopics = await taxonomyApi.subTopicsByTopics(convertedTopics)
          const subTopicNameToId = new Map(subTopics.map((st) => [st.name, st.id]))
          convertedSubTopics = form.sub_topics.map((st) => {
            if (st.includes('-')) return st // Already an ID
            return subTopicNameToId.get(st) ?? st
          })
        }

        // Update form with converted values
        setForm((f) => ({
          ...f,
          subject: subjectId,
          topics: convertedTopics,
          sub_topics: convertedSubTopics,
        }))
      } catch (error) {
        console.error('Failed to convert topics to IDs:', error)
      } finally {
        setLoadingTopics(false)
      }
    })()
  }, [existing?.id])

  async function save(mode: 'draft' | 'next') {
    const nextErrors = validateTestForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    // "Save as draft" parks the test; "Next" keeps whatever status it already
    // has, so editing a published test does not silently unpublish it.
    const status: TestStatus =
      mode === 'draft' ? 'draft' : ((existing?.status as TestStatus) ?? 'draft')
    const payload = formToPayload(form, status)

    setSaving(mode)
    try {
      const saved = isEdit
        ? await testsApi.update(id as string, payload)
        : await testsApi.create(payload)
      const savedId = saved?.id ?? id

      if (mode === 'draft') {
        toast.success(`"${payload.name}" saved as a draft.`)
        navigate('/dashboard')
      } else {
        if (!savedId) throw new Error('The API did not return a test id.')
        navigate(`/tests/${savedId}/questions`)
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  if (isEdit && test.loading) return <LoadingBlock label="Loading test" />
  if (isEdit && test.error) {
    return (
      <div className="page">
        <ErrorState message={test.error} onRetry={test.reload} />
      </div>
    )
  }

  const typeLabel =
    TEST_TYPES.find((item) => item.value === form.type)?.label ?? 'Chapterwise'

  return (
    <div className="page">
      <Breadcrumbs
        items={[
          { label: 'Test Creation', to: '/dashboard' },
          { label: isEdit ? 'Edit Test' : 'Create Test' },
          { label: typeLabel },
        ]}
      />

      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault()
          void save('next')
        }}
        noValidate
      >
        <TestForm
          form={form}
          errors={errors}
          onChange={setForm}
          onErrorsChange={setErrors}
          loadingTopics={loadingTopics}
        />

        <div className="form-actions" style={{ marginTop: 'var(--space-6)' }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            disabled={saving !== null}
          >
            Cancel
          </Button>
          {/* Not in the Figma, but the brief requires draft saving. */}
          <Button
            variant="outline"
            onClick={() => void save('draft')}
            loading={saving === 'draft'}
            disabled={saving !== null}
          >
            Save as Draft
          </Button>
          <Button type="submit" loading={saving === 'next'} disabled={saving !== null}>
            Next
          </Button>
        </div>
      </form>
    </div>
  )
}
