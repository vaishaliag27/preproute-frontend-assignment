import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTests, useSubjects, useDeleteTest } from '../hooks/useApi'
import { DASH, formatDate, joinNames, titleCase } from '../lib/format'
import type { Test } from '../types'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SearchIcon } from '../ui/icons'
import { ConfirmDialog } from '../ui/Modal'
import { Pagination } from '../ui/Pagination'
import { LoadingBlock } from '../ui/Spinner'
import { EmptyState, ErrorState } from '../ui/States'
import { useToast } from '../ui/toast/useToast'

type StatusFilter = 'all' | 'draft' | 'live' | 'scheduled' | 'incomplete'
const PAGE_SIZE = 10

function statusOf(test: Test): StatusFilter {
  const status = typeof test.status === 'string' ? test.status.toLowerCase() : ''
  if (status === 'live' || status === 'published') return 'live'
  if (status === 'draft') return 'draft'
  if (status === 'scheduled') return 'scheduled'
  return 'incomplete'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const testsQuery = useTests()
  const tests = {
    data: testsQuery.data,
    loading: testsQuery.isLoading,
    error: testsQuery.error?.message,
    reload: () => testsQuery.refetch()
  }

  const subjectsQuery = useSubjects()
  const subjects = {
    data: subjectsQuery.data,
    loading: subjectsQuery.isLoading,
    error: subjectsQuery.error?.message
  }

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [subject, setSubject] = useState('all')
  const [page, setPage] = useState(1)
  const [pendingDelete, setPendingDelete] = useState<Test | null>(null)

  const deleteTestMutation = useDeleteTest()

  // GET /tests returns subject and topics as display names, but a test read
  // back from GET /tests/:id may carry raw ids. Keep an id to name map so both
  // shapes render readable text.
  const subjectNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of subjects.data ?? []) map.set(item.id, item.name)
    return map
  }, [subjects.data])

  const rows = useMemo(() => {
    const label = (test: Test) =>
      test.subject_name ??
      (test.subject ? (subjectNames.get(test.subject) ?? test.subject) : DASH)
    return (tests.data ?? []).map((test) => ({ test, subjectLabel: label(test) }))
  }, [tests.data, subjectNames])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter(({ test, subjectLabel }) => {
      if (status !== 'all' && statusOf(test) !== status) return false
      if (subject !== 'all' && subjectLabel !== subject) return false
      if (!needle) return true
      const haystack = [test.name, subjectLabel, ...(test.topics ?? [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [rows, query, status, subject])

  useEffect(() => {
    setPage(1)
  }, [visible])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visible.slice(start, start + PAGE_SIZE)
  }, [visible, page])

  const subjectOptions = useMemo(() => {
    const values = new Set<string>()
    for (const { subjectLabel } of rows) {
      if (subjectLabel && subjectLabel !== DASH) values.add(subjectLabel)
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  }, [rows])

  async function confirmDelete() {
    if (!pendingDelete) return
    setPendingDelete(null)
    try {
      await deleteTestMutation.mutateAsync(pendingDelete.id)
      toast.success(`"${pendingDelete.name}" was deleted.`)
    } catch {
      toast.error('Failed to delete test')
    }
  }

  const filtersActive = query.trim() !== '' || status !== 'all' || subject !== 'all'

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Tests</h1>
          <p className="page__subtitle">
            {!tests.loading
              ? `${(tests.data ?? []).length} test${(tests.data ?? []).length === 1 ? '' : 's'} in your library`
              : 'Loading your test library'}
          </p>
        </div>
        <Button onClick={() => navigate('/tests/new')}>Create new test</Button>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <SearchIcon size={16} />
          <input
            className="control"
            type="search"
            placeholder="Search by name, subject or topic"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search tests"
          />
        </div>
        <select
          className="control toolbar__filter"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="live">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
          <option value="incomplete">Incomplete</option>
        </select>
        <select
          className="control toolbar__filter"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          aria-label="Filter by subject"
        >
          <option value="all">All subjects</option>
          {subjectOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              setStatus('all')
              setSubject('all')
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {tests.loading && <LoadingBlock label="Loading tests" />}

      {!tests.loading && tests.error && (
        <ErrorState message={tests.error} onRetry={tests.reload} />
      )}

      {!tests.loading && !tests.error && visible.length === 0 && (
        <EmptyState
          title={filtersActive ? 'No tests match your filters' : 'No tests yet'}
          description={
            filtersActive
              ? 'Try a different search term or clear the filters.'
              : 'Create your first test to start building a question bank.'
          }
          action={
            filtersActive ? undefined : (
              <Button onClick={() => navigate('/tests/new')}>Create new test</Button>
            )
          }
        />
      )}

      {!tests.loading && !tests.error && visible.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Test name</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Topics</th>
                  <th scope="col">Questions</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(({ test, subjectLabel }) => (
                <tr key={test.id}>
                  <td data-label="Test name">
                    <Link className="table__link" to={`/tests/${test.id}/publish`}>
                      {test.name}
                    </Link>
                    <span className="table__meta">{titleCase(test.type)}</span>
                  </td>
                  <td data-label="Subject">{subjectLabel}</td>
                  <td data-label="Topics" className="table__topics">
                    {joinNames(test.topics as string[] | undefined)}
                  </td>
                  <td data-label="Questions">
                    {test.total_questions ?? test.questions?.length ?? 0}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={test.status} />
                  </td>
                  <td data-label="Created">{formatDate(test.created_at)}</td>
                  <td data-label="Actions">
                    <div className="table__actions">
                      {(statusOf(test) === 'live' || statusOf(test) === 'scheduled') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/tests/${test.id}/publish?mode=view`)}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/tests/${test.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingDelete(test)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={visible.length}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this test?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" and its questions will be removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete test"
        destructive
        busy={deleteTestMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
