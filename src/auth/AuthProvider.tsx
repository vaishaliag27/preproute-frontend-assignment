import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import type { User } from '../types'
import { AuthContext } from './context'
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
  setUnauthorizedHandler,
} from './session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setIsAuthenticated(false)
    navigate('/login', { replace: true })
  }, [navigate])

  // A 401 from any endpoint drops the session and returns to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setIsAuthenticated(false)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(() => {})
  }, [navigate])

  const login = useCallback(async (userId: string, password: string) => {
    const result = await authApi.login(userId, password)
    if (!result?.token) throw new Error('Login succeeded but no token was returned.')
    saveSession(result.token, result.user ?? null)
    setUser(result.user ?? null)
    setIsAuthenticated(true)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
