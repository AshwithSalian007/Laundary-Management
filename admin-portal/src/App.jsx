import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './features/auth/context/AuthContext'
import LoginPage from './features/auth/components/LoginPage'
import Dashboard from './features/dashboard/components/Dashboard'
import StaffManagement from './features/staff/components/StaffManagement'
import RoleManagement from './features/roles/components/RoleManagement'
import DepartmentManagement from './features/departments/components/DepartmentManagement'
import BatchManagement from './features/batches/components/BatchManagement'
import StudentManagement from './features/students/components/StudentManagement'
import WashPolicyManagement from './features/laundry/components/WashPolicyManagement'
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
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/staff"
        element={isAuthenticated ? <StaffManagement /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/roles"
        element={isAuthenticated ? <RoleManagement /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/departments"
        element={isAuthenticated ? <DepartmentManagement /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/batches"
        element={isAuthenticated ? <BatchManagement /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/students"
        element={isAuthenticated ? <StudentManagement /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/policies"
        element={isAuthenticated ? <WashPolicyManagement /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
