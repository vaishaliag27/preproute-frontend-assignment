import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { errorMessage } from '../hooks/useResource'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { LoginArt } from '../ui/LoginArt'
import { Wordmark } from '../ui/Wordmark'

interface Errors {
  userId?: string
  password?: string
}

function validate(userId: string, password: string): Errors {
  const errors: Errors = {}
  if (!userId.trim()) errors.userId = 'User ID is required.'
  else if (userId.trim().length < 3) errors.userId = 'User ID must be at least 3 characters.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 4) errors.password = 'Password must be at least 4 characters.'
  return errors
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (isAuthenticated) return <Navigate to={from} replace />

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextErrors = validate(userId, password)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await login(userId.trim(), password)
      navigate(from, { replace: true })
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__frame">
        <div className="login__art">
          <LoginArt />
        </div>

        <div className="login__side">
          <div className="login__card">
            <div className="login__logo">
              <Wordmark />
            </div>

            <h1 className="login__title">Login</h1>
            <p className="login__subtitle">Use your company provided Login credentials</p>

            <form className="login__form" onSubmit={onSubmit} noValidate>
              {formError && (
                <div className="alert alert--error" role="alert">
                  {formError}
                </div>
              )}

              <Field label="User ID" error={errors.userId}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
                    type="text"
                    placeholder="Enter User ID"
                    autoComplete="username"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </Field>

              <Field label="Password" error={errors.password}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    className={`control ${invalid ? 'control--invalid' : ''}`.trim()}
                    type="password"
                    placeholder="Enter Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                  />
                )}
              </Field>

              <a className="login__forgot" href="#forgot">
                Forgot password?
              </a>

              <Button type="submit" loading={submitting} className="login__submit">
                {submitting ? 'Signing in' : 'Login'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
