import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PublishPage } from './pages/PublishPage'
import { QuestionsPage } from './pages/QuestionsPage'
import { TestFormPage } from './pages/TestFormPage'
import { AppLayout } from './ui/AppLayout'
import { ToastProvider } from './ui/toast/ToastProvider'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tests/new" element={<TestFormPage />} />
            <Route path="/tests/:id/edit" element={<TestFormPage />} />
            <Route path="/tests/:id/questions" element={<QuestionsPage />} />
            <Route path="/tests/:id/publish" element={<PublishPage />} />
            {/* Older link shape kept working. */}
            <Route path="/tests/:id/preview" element={<PublishPage />} />
          </Route>
        </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
