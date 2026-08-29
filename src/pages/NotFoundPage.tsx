import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="page page--centered">
      <div className="state state--empty">
        <h1>Page not found</h1>
        <p>The page you were looking for does not exist.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
      </div>
    </div>
  )
}
