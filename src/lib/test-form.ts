import type { Difficulty, Test, TestPayload, TestStatus, TestType } from '../types'

export const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Difficult' },
]

export interface TestFormState {
  name: string
  type: TestType
  subject: string
  topics: string[]
  sub_topics: string[]
  difficulty: Difficulty
  correct_marks: string
  wrong_marks: string
  unattempt_marks: string
  total_time: string
  total_questions: string
}

export const EMPTY_TEST_FORM: TestFormState = {
  name: '',
  type: 'chapterwise',
  subject: '',
  topics: [],
  sub_topics: [],
  difficulty: 'easy',
  correct_marks: '+5',
  wrong_marks: '-1',
  unattempt_marks: '+0',
  total_time: '',
  total_questions: '',
}

export type TestFormErrors = Partial<Record<keyof TestFormState, string>>

/** Total marks is always derived, matching the read-only field in the design. */
export function totalMarksFor(form: TestFormState): number {
  const questions = Number(form.total_questions)
  const perCorrect = Number(form.correct_marks)
  if (!Number.isFinite(questions) || !Number.isFinite(perCorrect)) return 0
  return Math.max(0, Math.round(questions * perCorrect))
}

export function testToForm(test: Test): TestFormState {
  const difficulty = String(test.difficulty ?? 'easy').toLowerCase()
  const type = String(test.type ?? 'chapterwise').toLowerCase()
  const sign = (value: number | undefined, fallback: string) =>
    value === undefined || value === null
      ? fallback
      : value > 0
        ? `+${value}`
        : String(value)

  return {
    name: test.name ?? '',
    type: TEST_TYPES.some((item) => item.value === type)
      ? (type as TestType)
      : 'chapterwise',
    subject: (test.subject as string) ?? '',
    topics: (test.topics ?? []) as string[],
    sub_topics: (test.sub_topics ?? []) as string[],
    difficulty: DIFFICULTIES.some((item) => item.value === difficulty)
      ? (difficulty as Difficulty)
      : 'easy',
    correct_marks: sign(test.correct_marks, '+5'),
    wrong_marks: sign(test.wrong_marks, '-1'),
    unattempt_marks: sign(test.unattempt_marks, '+0'),
    total_time: test.total_time ? String(test.total_time) : '',
    total_questions: String(test.total_questions ?? test.questions?.length ?? ''),
  }
}

function isNumeric(value: string) {
  return value.trim() !== '' && Number.isFinite(Number(value))
}

export function validateTestForm(form: TestFormState): TestFormErrors {
  const errors: TestFormErrors = {}

  if (!form.name.trim()) errors.name = 'Test name is required.'
  else if (form.name.trim().length < 3) errors.name = 'Use at least 3 characters.'

  if (!form.subject) errors.subject = 'Choose a subject.'
  if (form.topics.length === 0) errors.topics = 'Select at least one topic.'

  if (!isNumeric(form.correct_marks)) errors.correct_marks = 'Enter a number.'
  else if (Number(form.correct_marks) <= 0) errors.correct_marks = 'Must be greater than 0.'

  if (!isNumeric(form.wrong_marks)) errors.wrong_marks = 'Enter a number.'
  else if (Number(form.wrong_marks) > 0) errors.wrong_marks = 'Use 0 or a negative value.'

  if (!isNumeric(form.unattempt_marks)) errors.unattempt_marks = 'Enter a number.'

  if (!isNumeric(form.total_time)) errors.total_time = 'Enter the duration in minutes.'
  else if (Number(form.total_time) <= 0) errors.total_time = 'Must be at least 1 minute.'

  if (!isNumeric(form.total_questions)) errors.total_questions = 'Enter a number.'
  else if (Number(form.total_questions) <= 0) errors.total_questions = 'Must be at least 1.'

  return errors
}

export function formToPayload(form: TestFormState, status: TestStatus): TestPayload {
  return {
    name: form.name.trim(),
    type: form.type,
    subject: form.subject,
    topics: form.topics,
    sub_topics: form.sub_topics,
    correct_marks: Number(form.correct_marks),
    wrong_marks: Number(form.wrong_marks),
    unattempt_marks: Number(form.unattempt_marks),
    difficulty: form.difficulty,
    total_time: Number(form.total_time),
    total_marks: totalMarksFor(form),
    total_questions: Number(form.total_questions),
    status,
  }
}
