import { Navigate, Route, Routes } from "react-router-dom"
import { useAppStore } from "./store/useStore"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import PatientDetail from "./pages/PatientDetail"
import Unauthorized from "./pages/Unauthorized"
import AuditLogView from "./components/AuditLogView"

type Role = "nurse" | "doctor" | "admin"

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: Role[]
}) {
  const { isAuthenticated, hasAnyRole } = useAppStore.getState()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  if (!hasAnyRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}

export default function RoutesComponent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["nurse", "doctor", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/me"
        element={
          <ProtectedRoute allowedRoles={["nurse", "doctor", "admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:patientId"
        element={
          <ProtectedRoute allowedRoles={["nurse", "doctor", "admin"]}>
            <PatientDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AuditLogView />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
