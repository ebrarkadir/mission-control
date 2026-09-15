import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route
                path="vehicles"
                element={
                  <PlaceholderPage
                    title="Vehicles"
                    description="Fleet registry and vehicle status monitoring."
                  />
                }
              />
              <Route
                path="missions"
                element={
                  <PlaceholderPage
                    title="Missions"
                    description="Mission planning, assignment, and lifecycle tracking."
                  />
                }
              />
              <Route
                path="telemetry"
                element={
                  <PlaceholderPage
                    title="Live Telemetry"
                    description="Real-time vehicle telemetry and sensor data streams."
                  />
                }
              />
              <Route
                path="alerts"
                element={
                  <PlaceholderPage
                    title="Alerts"
                    description="Operational alerts and incident response queue."
                  />
                }
              />
              <Route
                path="notifications"
                element={
                  <PlaceholderPage
                    title="Notifications"
                    description="System notifications and operator messaging."
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
