/** Shapes returned by / sent to the Preproute API. */

export type Id = string

export interface ApiEnvelope<T> {
  status: 'success' | 'error'
  data: T
  message?: string
}

export interface User {
  id?: Id
  userId?: string
  name?: string
  email?: string
  role?: string
  [key: string]: unknown
}

export interface LoginResponse {
  token: string
  user: User
}

export interface Subject {
  id: Id
  name: string
}

export interface Topic {
  id: Id
  name: string
  subject_id?: Id
}

export interface SubTopic {
  id: Id
  name: string
  topic_id?: Id
}

export type TestStatus = 'draft' | 'unpublished' | 'scheduled' | 'expired' | 'live'

export type Difficulty = 'easy' | 'medium' | 'hard'

/** The three tabs on the test creation screen. */
export type TestType = 'chapterwise' | 'pyq' | 'mock'

/**
 * A test as returned by the API. The list endpoint returns `subject`/`topics`
 * as display names, while a single test may return ids — every consumer here
 * tolerates both.
 */
export interface Test {
  id: Id
  name: string
  type?: TestType | string
  subject?: Id | string
  subject_name?: string
  topics?: (Id | string)[]
  sub_topics?: (Id | string)[]
  questions?: Id[]
  correct_marks?: number
  wrong_marks?: number
  unattempt_marks?: number
  difficulty?: Difficulty | string
  total_time?: number
  total_marks?: number
  total_questions?: number
  status?: TestStatus | string
  created_at?: string
  updated_at?: string
  /* Publishing schedule — see the publish screen. Not in the API brief. */
  scheduled_at?: string | null
  live_until?: string | null
  live_duration?: string | null
}

/** Body accepted by POST /tests and PUT /tests/:id. */
export interface TestPayload {
  name: string
  type: string
  subject: Id
  topics: Id[]
  sub_topics: Id[]
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  difficulty: Difficulty
  total_time: number
  total_marks: number
  total_questions: number
  status: TestStatus
}

export type OptionKey = 'option1' | 'option2' | 'option3' | 'option4'

export interface Question {
  id: Id
  type: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: OptionKey
  explanation?: string
  difficulty?: Difficulty | string
  topic?: Id | null
  sub_topic?: Id | null
  media_url?: string | null
  test_id?: Id
  subject?: Id | string
}

/** A question being composed on the Add Questions page, before it has an id. */
export type QuestionDraft = Omit<Question, 'id'> & { id?: Id }

/** Body accepted by PUT /tests/:id, which also re-links the question list. */
export interface TestUpdate extends Partial<TestPayload> {
  questions?: Id[]
  scheduled_at?: string | null
  live_until?: string | null
  live_duration?: string | null
}
