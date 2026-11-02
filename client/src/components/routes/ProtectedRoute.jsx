import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/useAuth';
import { PageSpinner } from '../ui/Spinner';

// Wraps pages that need a logged-in user. Pass role="admin" for admin-only pages.
// This only hides pages in the browser — the real protection is the API's
// protect/adminOnly middleware, which returns 401/403 no matter what the UI does.
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;

  if (!user) {
    // Remember where they were going, so login can send them back there
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // render the matched child page
}
