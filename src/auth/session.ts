import { configureHttp } from '../lib/http'
import type { User } from '../types'

const TOKEN_KEY = 'preproute.token'
const USER_KEY = 'preproute.user'

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private-browsing modes can reject writes; the session stays in memory.
  }
}

let token: string | null = readStorage(TOKEN_KEY)

export function getToken(): string | null {
  return token
}

export function getStoredUser(): User | null {
  const raw = readStorage(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function saveSession(nextToken: string, user: User | null) {
  token = nextToken
  writeStorage(TOKEN_KEY, nextToken)
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null)
}

export function clearSession() {
  token = null
  writeStorage(TOKEN_KEY, null)
  writeStorage(USER_KEY, null)
}

let unauthorizedHandler: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

// Registered at module load so the very first request already carries the JWT,
// regardless of which component fires it.
configureHttp({
  getToken,
  onUnauthorized: () => {
    clearSession()
    unauthorizedHandler()
  },
})
