import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MissionsPage } from './pages/MissionsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { VehiclesPage } from './pages/VehiclesPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="vehicles" element={<VehiclesPage />} />
                <Route path="missions" element={<MissionsPage />} />
                <Route path="telemetry" element={<TelemetryPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
