import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext'
import LoginPage from './features/auth/components/LoginPage'
import LoadingSpinner from './shared/components/LoadingSpinner'

function App() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen size="xl" />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <div className="min-h-screen bg-gray-100 p-8">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  SmartWash Admin Dashboard
                </h1>
                <p className="text-gray-600">Welcome to the admin portal. Dashboard coming soon...</p>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
