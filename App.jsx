// ============================================================
// App.jsx - Root application with routing and auth guards
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import ReportForm from './components/Reports/ReportForm';
import ReportsList from './components/Reports/ReportsList';
import MapView from './components/Map/MapView';
import AdminPanel from './components/Admin/AdminPanel';

// ── Private Route Guard ───────────────────────────────────────
// Redirects unauthenticated users to /login
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="text-center space-y-3">
          <div className="spinner mx-auto" />
          <p className="text-gray-500 text-sm font-mono">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

// ── Admin Route Guard ─────────────────────────────────────────
// Only allows admin users; redirects others to dashboard
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-900">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

// ── App Routes (uses auth context) ───────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />

      {/* Protected routes wrapped in the sidebar Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="report"    element={<ReportForm />} />
        <Route path="reports"   element={<ReportsList />} />
        <Route path="map"       element={<MapView />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
      </Route>

      {/* Catch-all: redirect unknown paths */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── Root App Component ────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
