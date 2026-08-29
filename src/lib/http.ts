import type { ApiEnvelope } from '../types'
import { ApiError } from './api-error'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export { ApiError }

type TokenReader = () => string | null
type UnauthorizedHandler = () => void

let readToken: TokenReader = () => null
let onUnauthorized: UnauthorizedHandler = () => {}

/** Wired up once by the auth provider so the client can attach the JWT. */
export function configureHttp(options: {
  getToken: TokenReader
  onUnauthorized: UnauthorizedHandler
}) {
  readToken = options.getToken
  onUnauthorized = options.onUnauthorized
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Login is the only endpoint that must not send an Authorization header. */
  auth?: boolean
  signal?: AbortSignal
}

function messageFor(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    for (const key of ['message', 'error', 'detail']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value
    }
  }
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404) return 'The requested resource was not found.'
  if (status >= 500) return 'The server ran into a problem. Please try again.'
  return `Request failed (${status})`
}

/**
 * Performs a request and unwraps the `{ status, data }` envelope the API
 * uses. Throws an ApiError for transport failures, non-2xx responses, and
 * envelopes reporting `status: "error"`.
 */
export async function request<T>(
  path: string,
  { method = 'GET', body, auth = true, signal }: RequestOptions = {},
): Promise<T> {
  const token = auth ? readToken() : null

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(
      'Could not reach the server. Check your connection and the API base URL.',
      0,
    )
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized()
    throw new ApiError(messageFor(response.status, payload), response.status, payload)
  }

  const envelope = payload as ApiEnvelope<T> | null
  if (envelope && typeof envelope === 'object' && 'status' in envelope) {
    if (envelope.status !== 'success') {
      throw new ApiError(envelope.message ?? 'Request failed', response.status, payload)
    }
    return envelope.data
  }

  // Tolerate endpoints that return a bare payload instead of the envelope.
  return payload as T
}
