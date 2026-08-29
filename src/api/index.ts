import { request } from '../lib/http'
import type {
  Id,
  LoginResponse,
  Question,
  QuestionDraft,
  Subject,
  SubTopic,
  Test,
  TestPayload,
  TestUpdate,
  Topic,
} from '../types'

export const authApi = {
  login: (userId: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { userId, password },
      auth: false,
    }),
}

export const taxonomyApi = {
  subjects: (signal?: AbortSignal) => request<Subject[]>('/subjects', { signal }),

  topicsBySubject: (subjectId: Id, signal?: AbortSignal) =>
    request<Topic[]>(`/topics/subject/${subjectId}`, { signal }),

  subTopicsByTopic: (topicId: Id, signal?: AbortSignal) =>
    request<SubTopic[]>(`/sub-topics/topic/${topicId}`, { signal }),

  /** Batched lookup for several topics at once. */
  subTopicsByTopics: (topicIds: Id[], signal?: AbortSignal) =>
    request<SubTopic[]>('/sub-topics/multi-topics', {
      method: 'POST',
      body: { topicIds },
      signal,
    }),
}

export const testsApi = {
  list: (signal?: AbortSignal) => request<Test[]>('/tests', { signal }),

  get: (id: Id, signal?: AbortSignal) => request<Test>(`/tests/${id}`, { signal }),

  create: (payload: TestPayload) =>
    request<Test>('/tests', { method: 'POST', body: payload }),

  update: (id: Id, payload: TestUpdate) =>
    request<Test>(`/tests/${id}`, { method: 'PUT', body: payload }),

  publish: (id: Id) =>
    request<Test>(`/tests/${id}`, { method: 'PUT', body: { status: 'live' } }),

  remove: (id: Id) => request<unknown>(`/tests/${id}`, { method: 'DELETE' }),
}

export const questionsApi = {
  /** Creates every staged question in one call and returns the saved rows. */
  bulkCreate: (questions: QuestionDraft[]) =>
    request<Question[]>('/questions/bulk', {
      method: 'POST',
      body: { questions },
    }),

  fetchBulk: (questionIds: Id[], signal?: AbortSignal) =>
    request<Question[]>('/questions/fetchBulk', {
      method: 'POST',
      body: { question_ids: questionIds },
      signal,
    }),

  update: (id: Id, question: Partial<Question>) =>
    request<Question>(`/questions/${id}`, { method: 'PUT', body: question }),

  remove: (id: Id) => request<unknown>(`/questions/${id}`, { method: 'DELETE' }),
}
