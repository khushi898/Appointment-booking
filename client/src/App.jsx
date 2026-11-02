import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/routes/ProtectedRoute';
import GuestRoute from './components/routes/GuestRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import BookPage from './pages/BookPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminAvailabilityPage from './pages/admin/AdminAvailabilityPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import NotFoundPage from './pages/NotFoundPage';

// Every page in the app and who may see it.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route index element={<HomePage />} />

          {/* Only when logged OUT */}
          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="appointments" element={<MyAppointmentsPage />} />
            <Route path="book/:serviceId" element={<BookPage />} />
          </Route>

          {/* Admins only */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/services" element={<AdminServicesPage />} />
            <Route path="admin/availability" element={<AdminAvailabilityPage />} />
            <Route path="admin/appointments" element={<AdminAppointmentsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
